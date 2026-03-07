<?php
/**
 * 将附件上传到 BSImg 图床并替换为图床 URL
 */

if (!defined('ABSPATH')) {
    exit;
}

class BSImgBed_Uploader {

    const META_KEY = '_bsimgbed_url';

    private static $instance = null;

    /** 临时保存本次上传的图床结果，key 为本地文件路径，供 add_attachment 使用 */
    private static $pending_by_file = array();

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * 获取图床设置
     */
    private function get_settings() {
        $settings = get_option('bsimgforwp_settings', array());
        return wp_parse_args($settings, array(
            'base_url'    => '',
            'api_key'     => '',
            'use_private' => false,
            'bucket_id'   => '',
            'timeout'     => 30,
            'ssl_verify'  => true,
        ));
    }

    /**
     * 检查是否已配置并可上传
     */
    private function is_ready() {
        $s = $this->get_settings();
        $base = trim($s['base_url']);
        if (empty($base)) {
            return false;
        }
        $base = rtrim($base, '/');
        if ($s['use_private'] && empty(trim($s['api_key']))) {
            return false;
        }
        return true;
    }

    /**
     * 上传文件到图床
     *
     * @param string $file_path 本地文件路径
     * @param string $filename  原始文件名（可选）
     * @return array|WP_Error 成功返回 array('url' => 完整图片URL)，失败返回 WP_Error
     */
    public function upload_to_bsimgbed($file_path, $filename = '') {
        if (!file_exists($file_path) || !is_readable($file_path)) {
            return new WP_Error('bsimgbed_file', __('文件不存在或不可读', 'bsimgforwp'));
        }

        $s = $this->get_settings();
        $base_url = rtrim(trim($s['base_url']), '/');
        if (empty($base_url)) {
            return new WP_Error('bsimgbed_config', __('请先在设置中填写图床地址', 'bsimgforwp'));
        }

        $use_private = !empty($s['use_private']) && !empty(trim($s['api_key']));
        $endpoint = $use_private
            ? $base_url . '/api/upload/private'
            : $base_url . '/api/upload/public';

        $boundary = wp_generate_password(24, false);
        $file_content = file_get_contents($file_path);
        $upload_name = $filename ?: basename($file_path);
        $mime = wp_check_filetype($file_path, null)['type'] ?: 'application/octet-stream';

        $body = '';
        if (!empty($s['bucket_id'])) {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"bucketId\"\r\n\r\n";
            $body .= trim($s['bucket_id']) . "\r\n";
        }
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"" . basename($upload_name) . "\"\r\n";
        $body .= "Content-Type: {$mime}\r\n\r\n";
        $body .= $file_content . "\r\n";
        $body .= "--{$boundary}--\r\n";

        $headers = array(
            'Content-Type'   => 'multipart/form-data; boundary=' . $boundary,
            'Content-Length' => strlen($body),
        );
        if ($use_private) {
            $headers['X-API-Key'] = trim($s['api_key']);
        }

        $timeout = isset($s['timeout']) ? max(5, min(120, (int) $s['timeout'])) : 30;
        $ssl_verify = !isset($s['ssl_verify']) || $s['ssl_verify'];

        $response = wp_remote_post($endpoint, array(
            'timeout'   => $timeout,
            'sslverify' => $ssl_verify,
            'headers'   => $headers,
            'body'      => $body,
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        $body_raw = wp_remote_retrieve_body($response);
        $data = is_string($body_raw) ? json_decode($body_raw, true) : null;

        if ($code !== 200) {
            $message = (is_array($data) && !empty($data['message'])) ? $data['message'] : __('图床返回错误', 'bsimgforwp');
            return new WP_Error('bsimgbed_upload', $message . ' (HTTP ' . $code . ')');
        }
        if (!is_array($data) || empty($data['success']) || empty($data['data']['url'])) {
            $message = (is_array($data) && !empty($data['message'])) ? $data['message'] : __('图床返回数据无效', 'bsimgforwp');
            return new WP_Error('bsimgbed_upload', $message);
        }

        $path = $data['data']['url'];
        if (strpos($path, 'http') === 0) {
            $image_url = $path;
        } else {
            $image_url = $base_url . (strpos($path, '/') === 0 ? '' : '/') . $path;
        }

        return array(
            'url'      => $image_url,
            'id'       => isset($data['data']['id']) ? $data['data']['id'] : '',
            'uuid'     => isset($data['data']['uuid']) ? $data['data']['uuid'] : '',
            'format'   => isset($data['data']['format']) ? $data['data']['format'] : '',
            'width'    => isset($data['data']['width']) ? (int) $data['data']['width'] : 0,
            'height'   => isset($data['data']['height']) ? (int) $data['data']['height'] : 0,
        );
    }

    /**
     * 处理 WordPress 上传：将文件同步到图床并记录 URL
     */
    public function handle_upload($upload, $context) {
        if ($context !== 'upload' || empty($upload['file']) || !$this->is_ready()) {
            return $upload;
        }

        $file_path = $upload['file'];
        $type = wp_check_filetype($file_path, null);
        $allowed = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'svg');
        if (empty($type['ext']) || !in_array(strtolower($type['ext']), $allowed)) {
            return $upload;
        }

        $result = $this->upload_to_bsimgbed($file_path, $upload['url'] ? basename(parse_url($upload['url'], PHP_URL_PATH)) : '');

        if (is_wp_error($result)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[BSImg for WP] 上传图床失败: ' . $result->get_error_message());
            }
            return $upload;
        }

        $normalized_path = wp_normalize_path($file_path);
        self::$pending_by_file[$normalized_path] = $result;
        return $upload;
    }

    /**
     * 处理「从 URL 导入」：同步到图床并记录，供 add_attachment 写入 meta
     * 第二个参数为 WordPress 的 $overrides，此处未使用
     */
    public function handle_sideload($upload, $overrides = array()) {
        if (empty($upload['file']) || !$this->is_ready()) {
            return $upload;
        }
        return $this->handle_upload($upload, 'upload');
    }

    /**
     * 附件创建后，将图床 URL 写入 post meta
     */
    public function on_add_attachment($attachment_id) {
        $file = get_attached_file($attachment_id);
        if (!$file || !file_exists($file)) {
            return;
        }
        $file = wp_normalize_path($file);
        if (isset(self::$pending_by_file[$file])) {
            $result = self::$pending_by_file[$file];
            unset(self::$pending_by_file[$file]);
            update_post_meta($attachment_id, self::META_KEY, $result['url']);
            return;
        }
        if (get_post_meta($attachment_id, self::META_KEY, true)) {
            return;
        }
        if (!$this->is_ready()) {
            return;
        }
        $type = wp_check_filetype($file, null);
        $allowed = array('jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'avif', 'tiff', 'svg');
        if (empty($type['ext']) || !in_array(strtolower($type['ext']), $allowed)) {
            return;
        }
        $result = $this->upload_to_bsimgbed($file);
        if (is_wp_error($result)) {
            return;
        }
        update_post_meta($attachment_id, self::META_KEY, $result['url']);
    }

    /**
     * 返回附件 URL 时替换为图床 URL
     */
    public function filter_attachment_url($url, $attachment_id) {
        $bsimg_url = get_post_meta($attachment_id, self::META_KEY, true);
        if (is_string($bsimg_url) && $bsimg_url !== '') {
            return $bsimg_url;
        }
        return $url;
    }

    /**
     * 替换 wp_get_attachment_image_src 返回的 URL
     */
    public function filter_attachment_image_src($image, $attachment_id, $size, $icon) {
        if (!is_array($image) || empty($image[0])) {
            return $image;
        }
        $bsimg_url = get_post_meta($attachment_id, self::META_KEY, true);
        if (is_string($bsimg_url) && $bsimg_url !== '') {
            $image[0] = $bsimg_url;
        }
        return $image;
    }

    /**
     * 替换 srcset 中的 URL 为图床 URL
     */
    public function filter_srcset($sources, $size_array, $image_src, $image_meta, $attachment_id) {
        $bsimg_url = get_post_meta($attachment_id, self::META_KEY, true);
        if (!is_string($bsimg_url) || $bsimg_url === '') {
            return $sources;
        }
        if (!is_array($sources)) {
            return $sources;
        }
        foreach ($sources as $w => $src) {
            if (isset($src['url'])) {
                $sources[$w]['url'] = $bsimg_url;
            }
        }
        return $sources;
    }

    /**
     * REST API 附件响应中使用图床 URL（古腾堡、APP 等）
     */
    public function filter_rest_attachment($response, $post, $request) {
        if (!is_object($response) || !isset($response->data['source_url'])) {
            return $response;
        }
        $bsimg_url = get_post_meta($post->ID, self::META_KEY, true);
        if (is_string($bsimg_url) && $bsimg_url !== '') {
            $response->data['source_url'] = $bsimg_url;
        }
        return $response;
    }
}
