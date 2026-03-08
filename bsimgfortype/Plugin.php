<?php
/**
 * 将 Typecho 后台上传的图片接管到 BSImg 图床（bsimgbed），减轻站点存储压力并统一图片管理。
 *
 * @package Bsimgfortype
 * @author BSImg
 * @version 1.0.0
 * @link https://github.com/ilolioo/bsimgbed
 */

namespace TypechoPlugin\Bsimgfortype;

use Typecho\Plugin\PluginInterface;
use Typecho\Widget\Helper\Form;
use Typecho\Widget\Helper\Form\Element\Text;
use Typecho\Widget\Helper\Form\Element\Radio;
use Typecho\Widget\Helper\Form\Element\Checkbox;
use Widget\Options;
use Typecho\Common;
use Typecho\Db;
use Typecho\Plugin;

if (!defined('__TYPECHO_ROOT_DIR__')) {
    exit;
}

class Plugin implements PluginInterface
{
    /** 附件 path 前缀，表示该附件由图床托管 */
    const PATH_PREFIX = 'bsimgbed:';

    /**
     * 激活插件
     */
    public static function activate()
    {
        // 自定义上传：将文件上传到图床并返回图床 URL 作为 path
        Plugin::factory(\Widget\Upload::class)->uploadHandle = [__CLASS__, 'uploadHandle'];
        // 自定义附件 URL：path 为 bsimgbed:xxx 时返回图床完整 URL
        Plugin::factory(\Widget\Upload::class)->attachmentHandle = [__CLASS__, 'attachmentHandle'];
        // 自定义附件数据：远程图床时通过 URL 拉取内容
        Plugin::factory(\Widget\Upload::class)->attachmentDataHandle = [__CLASS__, 'attachmentDataHandle'];
        // 修改附件时也上传到图床
        Plugin::factory(\Widget\Upload::class)->modifyHandle = [__CLASS__, 'modifyHandle'];

        return _t('请进入 控制台 → 插件 → 配置 填写图床地址与 API Key（若使用私有上传）。');
    }

    /**
     * 停用插件
     */
    public static function deactivate()
    {
    }

    /**
     * 插件配置表单
     */
    public static function config(Form $form)
    {
        $baseUrl = new Text(
            'base_url',
            null,
            '',
            _t('图床地址'),
            _t('您的 bsimgbed 站点根地址，例如：https://img.example.com')
        );
        $form->addInput($baseUrl);

        $usePrivate = new Radio(
            'use_private',
            [
                '0' => _t('公共上传（需在图床后台开启“公共上传”）'),
                '1' => _t('私有上传（需填写下方 API Key）'),
            ],
            '0',
            _t('上传方式')
        );
        $form->addInput($usePrivate);

        $apiKey = new Text(
            'api_key',
            null,
            '',
            _t('API Key'),
            _t('选择“私有上传”时必填。在图床后台「我的」→ API 管理中创建。')
        );
        $form->addInput($apiKey);

        $bucketId = new Text(
            'bucket_id',
            null,
            '',
            _t('储存桶 ID'),
            _t('可选。图床多储存桶时填写，留空使用默认。')
        );
        $form->addInput($bucketId);

        $timeout = new Text(
            'timeout',
            null,
            '30',
            _t('请求超时（秒）'),
            _t('5–120，默认 30。')
        );
        $form->addInput($timeout);

        $sslVerify = new Checkbox(
            'ssl_verify',
            ['1' => _t('验证图床 HTTPS 证书（推荐）')],
            ['1'],
            _t('SSL 验证')
        );
        $form->addInput($sslVerify);
    }

    /**
     * 个人用户配置（本插件不需要）
     */
    public static function personalConfig(Form $form)
    {
    }

    /**
     * 获取插件配置
     */
    private static function getOptions(): \stdClass
    {
        $opts = Options::alloc()->plugin('Bsimgfortype');
        return (object) [
            'base_url'   => $opts ? rtrim(trim((string) $opts->base_url), '/') : '',
            'use_private' => $opts && (string) $opts->use_private === '1',
            'api_key'   => $opts ? trim((string) $opts->api_key) : '',
            'bucket_id' => $opts ? trim((string) $opts->bucket_id) : '',
            'timeout'   => $opts && (int) $opts->timeout > 0 ? min(120, max(5, (int) $opts->timeout)) : 30,
            'ssl_verify' => !$opts || (is_array($opts->ssl_verify) && in_array('1', $opts->ssl_verify, true)),
        ];
    }

    /**
     * 是否已配置并可上传
     */
    private static function isReady(): bool
    {
        $o = self::getOptions();
        if ($o->base_url === '') {
            return false;
        }
        if ($o->use_private && $o->api_key === '') {
            return false;
        }
        return true;
    }

    /**
     * 上传文件到 bsimgbed
     *
     * @param string $filePath 本地文件路径
     * @param string $filename 原始文件名
     * @return array{url: string, size: int, format: string}|null 成功返回数据，失败返回 null
     */
    private static function uploadToBsimgbed(string $filePath, string $filename = ''): ?array
    {
        if (!is_file($filePath) || !is_readable($filePath)) {
            return null;
        }

        $o = self::getOptions();
        if ($o->base_url === '') {
            return null;
        }
        if ($o->use_private && $o->api_key === '') {
            return null;
        }

        $endpoint = $o->use_private
            ? $o->base_url . '/api/upload/private'
            : $o->base_url . '/api/upload/public';

        $boundary = '----' . bin2hex(random_bytes(12));
        $safeName = $filename ?: basename($filePath);
        $safeName = str_replace(['"', '\\', "\r", "\n"], '', $safeName);
        if ($safeName === '') {
            $ext = pathinfo($filePath, PATHINFO_EXTENSION);
            $safeName = 'image' . ($ext ? '.' . $ext : '');
        }
        $mime = self::getMimeType($filePath);
        $body = '';

        if ($o->bucket_id !== '') {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"bucketId\"\r\n\r\n";
            $body .= $o->bucket_id . "\r\n";
        }
        if ($o->use_private) {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"showOnHomepage\"\r\n\r\n";
            $body .= "0\r\n";
        }
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"" . $safeName . "\"\r\n";
        $body .= "Content-Type: {$mime}\r\n\r\n";
        $body .= file_get_contents($filePath) . "\r\n";
        $body .= "--{$boundary}--\r\n";

        $headers = [
            'Content-Type: multipart/form-data; boundary=' . $boundary,
            'Content-Length: ' . strlen($body),
        ];
        if ($o->use_private) {
            $headers[] = 'X-API-Key: ' . $o->api_key;
        }

        $url = $endpoint;
        if (strpos($url, 'https://') !== 0 && strpos($url, 'http://') !== 0) {
            $url = 'https://' . $url;
        }

        $response = null;
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $body,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $o->timeout,
                CURLOPT_SSL_VERIFYPEER => $o->ssl_verify,
                CURLOPT_SSL_VERIFYHOST => $o->ssl_verify ? 2 : 0,
            ]);
            $response = curl_exec($ch);
            curl_close($ch);
        }
        if ($response === false || $response === null) {
            $ctx = stream_context_create([
                'http' => [
                    'method'  => 'POST',
                    'header'  => implode("\r\n", $headers),
                    'content' => $body,
                    'timeout' => $o->timeout,
                ],
                'ssl' => [
                    'verify_peer' => $o->ssl_verify,
                    'verify_peer_name' => $o->ssl_verify,
                ],
            ]);
            $response = @file_get_contents($url, false, $ctx);
        }
        if ($response === false || $response === null) {
            return null;
        }

        $data = json_decode($response, true);
        if (!is_array($data) || empty($data['success']) || empty($data['data'])) {
            return null;
        }

        $d = $data['data'];
        $path = $d['url'] ?? '';
        if ($path === '' && !empty($d['uuid']) && !empty($d['format'])) {
            $path = '/i/' . $d['uuid'] . '.' . $d['format'];
        }
        if ($path === '') {
            return null;
        }
        $imageUrl = (strpos($path, 'http') === 0) ? $path : $o->base_url . (strpos($path, '/') === 0 ? '' : '/') . $path;

        return [
            'url'   => $imageUrl,
            'size'  => (int) ($d['size'] ?? 0),
            'format' => $d['format'] ?? pathinfo($safeName, PATHINFO_EXTENSION) ?: 'jpg',
        ];
    }

    private static function getMimeType(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $map = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'bmp' => 'image/bmp',
            'ico' => 'image/x-icon',
            'avif' => 'image/avif',
            'tiff' => 'image/tiff',
            'tif' => 'image/tiff',
            'svg' => 'image/svg+xml',
        ];
        return $map[$ext] ?? 'application/octet-stream';
    }

    /**
     * 检查是否为允许的图片扩展名
     */
    private static function isAllowedImageExt(string $ext): bool
    {
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'tif', 'svg'];
        return in_array(strtolower($ext), $allowed, true);
    }

    /**
     * 自定义上传处理：将文件上传到图床，返回带 bsimgbed: 前缀的 path
     */
    public static function uploadHandle(array $file)
    {
        if (empty($file['name']) || !self::isReady()) {
            return null; // 不接管，交给默认逻辑
        }

        $tmpPath = $file['tmp_name'] ?? null;
        if (!$tmpPath || !is_uploaded_file($tmpPath)) {
            return null;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!self::isAllowedImageExt($ext)) {
            return null;
        }

        $result = self::uploadToBsimgbed($tmpPath, $file['name']);
        if ($result === null) {
            return null;
        }

        $size = $result['size'] > 0 ? $result['size'] : (int) ($file['size'] ?? 0);
        if ($size <= 0) {
            $size = (int) @filesize($tmpPath);
        }

        return [
            'name' => $file['name'],
            'path' => self::PATH_PREFIX . $result['url'],
            'size' => $size,
            'type' => $result['format'] ?: $ext,
            'mime' => self::getMimeTypeByExt($result['format'] ?: $ext),
        ];
    }

    /**
     * 自定义附件 URL：path 为 bsimgbed:xxx 时返回图床 URL
     */
    public static function attachmentHandle($attachment): string
    {
        $path = (string) $attachment->path;
        if (strpos($path, self::PATH_PREFIX) === 0) {
            return substr($path, strlen(self::PATH_PREFIX));
        }
        $options = Options::alloc();
        return Common::url(
            $path,
            defined('__TYPECHO_UPLOAD_URL__') ? __TYPECHO_UPLOAD_URL__ : $options->siteUrl
        );
    }

    /**
     * 自定义附件数据：图床附件时从远程 URL 读取
     */
    public static function attachmentDataHandle(array $content): string
    {
        $path = (string) $content['attachment']->path;
        if (strpos($path, self::PATH_PREFIX) === 0) {
            $url = substr($path, strlen(self::PATH_PREFIX));
            $o = self::getOptions();
            $ctx = stream_context_create([
                'http' => ['timeout' => 10],
                'ssl' => ['verify_peer' => $o->ssl_verify],
            ]);
            $data = @file_get_contents($url, false, $ctx);
            return $data !== false ? $data : '';
        }
        return file_get_contents(
            Common::url(
                $path,
                defined('__TYPECHO_UPLOAD_ROOT_DIR__') ? __TYPECHO_UPLOAD_ROOT_DIR__ : __TYPECHO_ROOT_DIR__
            )
        );
    }

    /**
     * 修改附件时：将新文件上传到图床并返回新 path
     */
    public static function modifyHandle(array $content, array $file)
    {
        if (empty($file['name']) || !self::isReady()) {
            return null;
        }

        $tmpPath = $file['tmp_name'] ?? null;
        if (!$tmpPath || !is_uploaded_file($tmpPath)) {
            return null;
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!self::isAllowedImageExt($ext)) {
            return null;
        }

        $result = self::uploadToBsimgbed($tmpPath, $file['name']);
        if ($result === null) {
            return null;
        }

        $size = $result['size'] > 0 ? $result['size'] : (int) ($file['size'] ?? 0);
        if ($size <= 0) {
            $size = (int) @filesize($tmpPath);
        }

        return [
            'name' => $content['attachment']->name,
            'path' => self::PATH_PREFIX . $result['url'],
            'size' => $size,
            'type' => $result['format'] ?: $ext,
            'mime' => $content['attachment']->mime ?: self::getMimeTypeByExt($result['format'] ?: $ext),
        ];
    }

    private static function getMimeTypeByExt(string $ext): string
    {
        return self::getMimeType('x.' . $ext);
    }
}
