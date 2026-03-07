<?php
/**
 * Plugin Name: BSImg 图床 for WordPress
 * Plugin URI: https://github.com/ilolioo/bsimgbed
 * Description: 将 WordPress 媒体库上传的图片接管到 BSImg 图床（bsimgbed），减轻站点存储压力并统一图片管理。
 * Version: 1.3.0
 * Author: BSImg
 * Author URI: https://github.com/ilolioo/bsimgbed
 * License: Apache-2.0
 * Text Domain: bsimgforwp
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('BSIMGFORWP_VERSION', '1.3.0');
define('BSIMGFORWP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('BSIMGFORWP_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once BSIMGFORWP_PLUGIN_DIR . 'includes/class-bsimgbed-uploader.php';
require_once BSIMGFORWP_PLUGIN_DIR . 'includes/class-bsimgbed-settings.php';

/**
 * 初始化插件
 */
function bsimgforwp_init() {
    $uploader = BSImgBed_Uploader::get_instance();
    $settings = BSImgBed_Settings::get_instance();

    // 新上传的附件：上传到图床并记录 URL（含「从 URL 导入」）
    add_filter('wp_handle_upload', array($uploader, 'handle_upload'), 10, 2);
    add_filter('wp_handle_sideload', array($uploader, 'handle_sideload'), 10, 2);
    add_action('add_attachment', array($uploader, 'on_add_attachment'));
    // 附件 URL 使用图床地址
    add_filter('wp_get_attachment_url', array($uploader, 'filter_attachment_url'), 10, 2);
    add_filter('wp_get_attachment_image_src', array($uploader, 'filter_attachment_image_src'), 10, 4);
    add_filter('wp_calculate_image_srcset', array($uploader, 'filter_srcset'), 10, 5);
    // REST API（古腾堡等）返回的附件数据使用图床 URL
    add_filter('rest_prepare_attachment', array($uploader, 'filter_rest_attachment'), 10, 3);
}
add_action('plugins_loaded', 'bsimgforwp_init');

/**
 * 插件激活时设置默认选项
 */
function bsimgforwp_activate() {
    if (get_option('bsimgforwp_settings') === false) {
        update_option('bsimgforwp_settings', array(
            'base_url'    => '',
            'api_key'     => '',
            'use_private' => false,
            'bucket_id'   => '',
        ));
    }
}
register_activation_hook(__FILE__, 'bsimgforwp_activate');

/**
 * 插件停用时不做删除，仅停用
 */
function bsimgforwp_deactivate() {
    // 可选：清理定时任务等
}
register_deactivation_hook(__FILE__, 'bsimgforwp_deactivate');
