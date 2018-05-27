<?php include "conf.php"; /* load a local configuration */ ?>
<?php include "vendor/autoload.php"; ?>
<?php include "modulekit/loader.php"; /* loads all php-includes */ ?>
<?php session_start(); ?>
<?php call_hooks("init"); /* initialize submodules */ ?>
<?php
_ajax_process();
