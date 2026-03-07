<?php
/**
 * 插件设置页面
 */

if (!defined('ABSPATH')) {
    exit;
}

class BSImgBed_Settings {

    const OPTION_KEY = 'bsimgforwp_settings';
    const PAGE_SLUG = 'bsimgforwp';

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        add_action('admin_menu', array($this, 'add_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_filter('plugin_action_links_' . plugin_basename(BSIMGFORWP_PLUGIN_DIR . 'bsimgforwp.php'), array($this, 'plugin_links'));
        add_action('admin_notices', array($this, 'maybe_show_notices'));
        add_action('admin_init', array($this, 'handle_test_connection'));
    }

    public function add_menu() {
        add_options_page(
            __('BSImg 图床设置', 'bsimgforwp'),
            __('BSImg 图床', 'bsimgforwp'),
            'manage_options',
            self::PAGE_SLUG,
            array($this, 'render_page')
        );
    }

    public function register_settings() {
        register_setting(self::PAGE_SLUG, self::OPTION_KEY, array(
            'type'              => 'array',
            'sanitize_callback'  => array($this, 'sanitize'),
        ));
    }

    public function sanitize($input) {
        if (!is_array($input)) {
            return get_option(self::OPTION_KEY, array());
        }
        $current = get_option(self::OPTION_KEY, array());
        $out = array(
            'base_url'    => isset($input['base_url']) ? esc_url_raw(trim($input['base_url'])) : '',
            'api_key'     => isset($input['api_key']) && $input['api_key'] !== '' ? sanitize_text_field($input['api_key']) : (isset($current['api_key']) ? $current['api_key'] : ''),
            'use_private' => !empty($input['use_private']),
            'bucket_id'   => isset($input['bucket_id']) ? sanitize_text_field(trim($input['bucket_id'])) : '',
        );
        $out['base_url'] = rtrim($out['base_url'], '/');
        return $out;
    }

    public function maybe_show_notices() {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'settings_page_' . self::PAGE_SLUG) {
            return;
        }
        if (isset($_GET['settings-updated']) && $_GET['settings-updated'] === 'true') {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('BSImg 图床设置已保存。', 'bsimgforwp') . '</p></div>';
        }
        if (isset($_GET['bsimgforwp_test']) && $_GET['bsimgforwp_test'] === 'ok') {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__('图床连接测试成功。', 'bsimgforwp') . '</p></div>';
        }
        if (isset($_GET['bsimgforwp_test']) && $_GET['bsimgforwp_test'] === 'fail') {
            $msg = isset($_GET['message']) ? sanitize_text_field(wp_unslash($_GET['message'])) : __('图床连接测试失败。', 'bsimgforwp');
            echo '<div class="notice notice-error is-dismissible"><p>' . esc_html__('图床连接测试失败：', 'bsimgforwp') . ' ' . esc_html($msg) . '</p></div>';
        }
    }

    /**
     * 处理「测试连接」请求：上传一张最小测试图到图床
     */
    public function handle_test_connection() {
        if (!isset($_GET['action']) || $_GET['action'] !== 'bsimgforwp_test' || !current_user_can('manage_options')) {
            return;
        }
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'bsimgforwp_test')) {
            wp_die(esc_html__('安全校验失败。', 'bsimgforwp'));
        }
        $uploader = BSImgBed_Uploader::get_instance();
        $opts = get_option(self::OPTION_KEY, array());
        $base_url = isset($opts['base_url']) ? trim($opts['base_url']) : '';
        $redirect = admin_url('options-general.php?page=' . self::PAGE_SLUG);
        if (empty($base_url)) {
            wp_safe_redirect(add_query_arg(array('bsimgforwp_test' => 'fail', 'message' => urlencode(__('请先填写图床地址并保存。', 'bsimgforwp'))), $redirect));
            exit;
        }
        // 最小 1x1 透明 GIF（约 43 字节）
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        $tmp = wp_tempnam('bsimgforwp');
        if (!$tmp || file_put_contents($tmp, $gif) === false) {
            wp_safe_redirect(add_query_arg(array('bsimgforwp_test' => 'fail', 'message' => urlencode(__('无法创建临时文件。', 'bsimgforwp'))), $redirect));
            exit;
        }
        $result = $uploader->upload_to_bsimgbed($tmp, 'test.gif');
        @unlink($tmp);
        if (is_wp_error($result)) {
            wp_safe_redirect(add_query_arg(array('bsimgforwp_test' => 'fail', 'message' => urlencode($result->get_error_message())), $redirect));
            exit;
        }
        wp_safe_redirect(add_query_arg('bsimgforwp_test', 'ok', $redirect));
        exit;
    }

    public function plugin_links($links) {
        $url = admin_url('options-general.php?page=' . self::PAGE_SLUG);
        $links[] = '<a href="' . esc_url($url) . '">' . __('设置', 'bsimgforwp') . '</a>';
        return $links;
    }

    public function render_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        $opts = get_option(self::OPTION_KEY, array());
        $base_url = isset($opts['base_url']) ? $opts['base_url'] : '';
        $api_key = isset($opts['api_key']) ? $opts['api_key'] : '';
        $use_private = !empty($opts['use_private']);
        $bucket_id = isset($opts['bucket_id']) ? $opts['bucket_id'] : '';
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <p><?php _e('将媒体库上传的图片同步到 BSImg 图床（bsimgbed），前台显示的图片地址将使用图床 URL。', 'bsimgforwp'); ?></p>

            <form action="options.php" method="post">
                <?php settings_fields(self::PAGE_SLUG); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="bsimgforwp_base_url"><?php _e('图床地址', 'bsimgforwp'); ?></label>
                        </th>
                        <td>
                            <input name="<?php echo esc_attr(self::OPTION_KEY); ?>[base_url]" id="bsimgforwp_base_url"
                                   type="url" value="<?php echo esc_attr($base_url); ?>"
                                   class="regular-text" placeholder="https://your-bsimgbed.com"/>
                            <p class="description"><?php _e('您的 bsimgbed 站点根地址，例如：https://img.example.com', 'bsimgforwp'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('上传方式', 'bsimgforwp'); ?></th>
                        <td>
                            <label>
                                <input type="radio" name="<?php echo esc_attr(self::OPTION_KEY); ?>[use_private]" value="0" <?php checked(!$use_private); ?> />
                                <?php _e('公共上传', 'bsimgforwp'); ?>
                            </label>
                            <p class="description"><?php _e('使用公共接口，无需 API Key；需在图床后台开启“公共上传”。', 'bsimgforwp'); ?></p>
                            <label style="display:block; margin-top:8px;">
                                <input type="radio" name="<?php echo esc_attr(self::OPTION_KEY); ?>[use_private]" value="1" <?php checked($use_private); ?> />
                                <?php _e('私有上传（API Key）', 'bsimgforwp'); ?>
                            </label>
                            <p class="description"><?php _e('使用私有接口，需在图床后台创建 API Key 并在下方填写。', 'bsimgforwp'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="bsimgforwp_api_key"><?php _e('API Key', 'bsimgforwp'); ?></label>
                        </th>
                        <td>
                            <input name="<?php echo esc_attr(self::OPTION_KEY); ?>[api_key]" id="bsimgforwp_api_key"
                                   type="password" value="<?php echo esc_attr($api_key); ?>"
                                   class="regular-text" autocomplete="off"/>
                            <p class="description"><?php _e('选择“私有上传”时必填。在图床后台 → API 管理中创建。留空则保留已保存的 Key。', 'bsimgforwp'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="bsimgforwp_bucket_id"><?php _e('储存桶 ID', 'bsimgforwp'); ?></label>
                        </th>
                        <td>
                            <input name="<?php echo esc_attr(self::OPTION_KEY); ?>[bucket_id]" id="bsimgforwp_bucket_id"
                                   type="text" value="<?php echo esc_attr($bucket_id); ?>"
                                   class="regular-text" placeholder="default"/>
                            <p class="description"><?php _e('可选。图床多储存桶时填写，留空使用图床默认储存桶。', 'bsimgforwp'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
                <p class="submit">
                    <?php
                    $test_url = wp_nonce_url(
                        add_query_arg('action', 'bsimgforwp_test', admin_url('admin.php')),
                        'bsimgforwp_test'
                    );
                    ?>
                    <a href="<?php echo esc_url($test_url); ?>" class="button button-secondary"><?php esc_html_e('测试图床连接', 'bsimgforwp'); ?></a>
                    <span class="description" style="margin-left:8px;"><?php esc_html_e('将上传一张最小测试图以验证配置。', 'bsimgforwp'); ?></span>
                </p>
            </form>

            <hr/>
            <h2><?php _e('说明', 'bsimgforwp'); ?></h2>
            <ul style="list-style:disc; margin-left:20px;">
                <li><?php _e('新上传的图片会自动同步到图床，并在前台使用图床链接显示。', 'bsimgforwp'); ?></li>
                <li><?php _e('已存在的媒体库附件不会自动迁移；如需迁移，可重新上传或使用第三方工具。', 'bsimgforwp'); ?></li>
                <li><?php _e('图床需允许跨域访问，否则部分主题/编辑器的图片可能无法正常显示。', 'bsimgforwp'); ?></li>
            </ul>
        </div>
        <?php
    }
}
