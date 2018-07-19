<?php
function database_markers ($options) {
  $anonym = true;

  if ($options['is_editor'] || $options['is_admin']) {
    $anonym = false;
  }

  $table_markers = array(
    'id' => 'markers',
    'table' => 'map_markers',
    'delete' => $options['is_admin'],
    'fields' => array(
      'id' => array(
        'type' => 'int',
      ),
      'lat' => array(
        'type' => 'float',
        'write' => $options['is_editor'],
      ),
      'lng' => array(
        'type' => 'float',
        'write' => $options['is_editor'],
      ),
      'survey' => array(
        'type' => 'int',
        'write' => $options['is_editor'],
      ),
      'street' => array(
        'type' => 'text',
        'write' => $options['is_editor'],
      ),
      'housenumber' => array(
        'type' => 'text',
        'write' => $options['is_editor'],
      ),
      'postcode' => array(
        'type' => 'int',
        'write' => $options['is_editor'],
      ),
      'city' => array(
        'type' => 'text',
        'write' => $options['is_admin'],
      ),
      'date' => array(
        'type' => 'text',
        'write' => $options['is_admin'],
      ),
      'day' => array(
        'type' => 'text',
        'select' => 'substr(date, 1, 10)',
        'include' => false,
      ),
      'likes' => array(
        'type' => 'int',
      ),
      'comments' => array(
        'type' => 'sub_table',
        'id' => 'map_comments',
        'parent_field' => 'marker',
        'delete' => $options['is_admin'],
        'fields' => array(
          'id' => array(
            'type' => 'int',
            'write' => $options['is_admin'],
          ),
          'marker' => array(
            'type' => 'int',
            'write' => $options['is_admin'],
          ),
          'message' => array(
            'type' => 'text',
            'write' => $options['is_admin'],
          ),
          'firstname' => array(
            'type' => 'text',
            'read' => true,
            'write' => $options['is_admin'],
          ),
          'lastname' => array(
            'type' => 'text',
            'select' => $anonym ? "concat(substr(name, 1, 1), '.')" : "name",
            'write' => $options['is_admin'],
            'column' => 'name',
          ),
          'name' => array(
            'type' => 'text',
            'select' => $anonym ? "concat(firstname, ' ', substr(name, 1, 1), '.')" : "concat(firstname, ' ', name)",
            'include' => false,
          ),
          'email' => array(
            'type' => 'text',
            'read' => !$anonym,
            'write' => $options['is_admin'],
          ),
          'gender' => array(
            'type' => 'int',
            'read' => !$anonym,
            'write' => $options['is_admin'],
          ),
          'newsletter' => array(
            'type' => 'boolean',
            'read' => $options['is_admin'],
            'write' => $options['is_admin'],
            'create_value' => 0,
          ),
          'newslettertest' => array(
            'type' => 'boolean',
            'read' => false,
            'create_value' => false,
          ),
          'date' => array(
            'type' => 'text',
            'write' => $options['is_admin'],
            'create_value' => date('Y-m-d H:i:s'),
          ),
          'day' => array(
            'type' => 'text',
            'select' => 'substr(date, 1, 10)',
            'include' => false,
          ),
          'ip' => array(
            'type' => 'int',
            'read' => false,
            'write' => false,
            'create_value' => '0'
          ),
          'visible' => array(
            'type' => 'boolean',
            'write' => $options['is_editor'],
          ),
          'attachments' => array(
            'type' => 'sub_table',
            'id' => 'images',
            'parent_field' => 'context',
            'delete' => $options['is_admin'],
            'fields' => array(
              'id' => array(
                'type' => 'int',
              ),
              'context' => array(
                'type' => 'int',
                'write' => $options['is_admin'],
              ),
              'type' => array(
                'type' => 'int',
              ),
              'date' => array(
                'type' => 'text',
              ),
              'file' => array(
                'type' => 'text',
              ),
              'rawfile' => array(
                'type' => 'text',
              ),
              'ord' => array(
                'type' => 'int',
              ),
              'width' => array(
                'type' => 'int',
              ),
              'height' => array(
                'type' => 'int',
              ),
              'text' => array(
                'type' => 'text',
              ),
            ),
          ),
        ),
      ),
      'commentsCount' => array(
        'type' => 'int',
        'select' => 'select count(*) from map_comments where map_comments.marker=map_markers.id',
      ),
      'lastCommentDate' => array(
        'type' => 'text',
        'select' => 'select date from map_comments where map_comments.marker=map_markers.id order by date desc limit 1'
      ),
      'lastCommentDay' => array(
        'type' => 'text',
        'select' => 'select substr(date, 1, 10) from map_comments where map_comments.marker=map_markers.id order by date desc limit 1',
        'include' => false,
      ),
      'visible' => array(
        'type' => 'boolean',
        'write' => $options['is_editor'],
      ),
      'status' => array(
        'type' => 'int',
        'write' => true,
        'write' => $options['is_editor'],
      ),
      'address' => array(
        'type' => 'text',
        'write' => $options['is_editor'],
      ),
    ),
  );

  return $table_markers;
}

register_hook('init', function () {
  global $api;
  global $dbconf;
  global $db;
  global $auth;
  global $history;

  $dbconf[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8";
  $db = new PDOext($dbconf);
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

  $options = array();
  $options['is_logged_in'] = $auth->is_logged_in();
  $options['is_admin'] = $auth->access('administrator');
  $options['is_editor'] = $options['is_admin'] || $auth->access('editor'); // every admin is editor

  $table_markers = database_markers($options);

  $table_surveys = array(
    'id' => 'survey',
    'table' => 'map_surveys',
    'fields' => array(
      'id' => array(
        'type' => 'int',
      ),
      'name' => array(
        'type' => 'text',
      ),
      'subtitle' => array(
        'type' => 'text',
      ),
      'startdate' => array(
        'type' => 'text',
      ),
      'enddate' => array(
        'type' => 'text',
      ),
      'active' => array(
        'type' => 'text',
      ),
      'commenting' => array(
        'type' => 'text',
      ),
      'public' => array(
        'type' => 'text',
      ),
    ),
  );

  $table_states = array(
    'id' => 'states',
    'table' => 'map_marker_state',
    'fields' => array(
      'id' => array(
        'type' => 'int',
      ),
      'name' => array(
        'type' => 'text',
      ),
      'showDefault' => array(
         'type' => 'boolean',
      ),
    ),
  );

  $api = new DBApi($db);
  $api->addTable($table_markers);
  $api->addTable($table_surveys);
  $api->addTable($table_states);

  if (isset($history)) {
    $dbhistory = new DBApiHistory($api, $history);

    $dbhistory->setTable(database_markers(array(
      'is_admin' => true,
      'is_editor' => true,
      'is_logged_in' => true,
    )));

    $dbhistory->checkInitialCommit();
  }

  html_export_var(array('rights' => array(
    'markers' => $table_markers,
    'survey' => $table_surveys,
    'states' => $table_states,
  )));
});
