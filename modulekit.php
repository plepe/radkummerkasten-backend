<?php
$id = "radkummerkasten-tools";
$name = "radkummerkasten-tools";
$depend = array("modulekit-form", "PDOext", "modulekit-auth", "auth-user-menu", "modulekit-auth-js", "modulekit-ajax");
$include = array(
  'php' => array(
    'src/rights.php',
  ),
);
$version = "0.6.3";
