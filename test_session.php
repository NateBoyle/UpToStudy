<?php

//test_session.php

session_start();
$_SESSION['test'] = 'Session is working!';
echo $_SESSION['test'];
?>