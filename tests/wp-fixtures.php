<?php
/** Local test fixtures only. Never install this MU plugin on a public site. */
add_filter('pre_option_kirchenplaner_apiurl', function() { return site_url(); });
add_filter('pre_option_kirchenplaner_csslib', function() { return isset($_GET['csslib']) && in_array($_GET['csslib'],array('bootstrap3','bootstrap4'),true) ? $_GET['csslib'] : ''; });
function kpt_events() {
    $base = array('untertitel'=>'','ansprechpartner'=>'Pfarrerin Anna Weber','raum_name_lang'=>'Stadtkirche St. Marien','raum_ort'=>'Lindenstadt','raum_teilort'=>'','raum_str'=>'Kirchplatz 1','raum_plz'=>'70173','veranstalter'=>'Evangelische Gemeinde','farbe_1'=>'315d48','beginn_wochentag_kurz_zwingend'=>'So','beginn_datum_zwingend'=>'29.11.2026','beginn_datum'=>'29.11.2026','beginn_zeit_zwingend'=>'10:00','beginn_zeit'=>'10:00','beginn_feiertage'=>'1. Advent','beginn_prot_feiertage'=>'1. Advent','beginn_kath_feiertage'=>'1. Advent','hauptbild_pfad'=>'','hauptbild_pfad_absolut'=>'','beschreibung_lang'=>'<p>Ein Moment zum Ankommen. Wir feiern den ersten Advent mit Musik, guten Gedanken und Zeit füreinander.</p><p>Der Kirchenchor begleitet den Gottesdienst. Im Anschluss laden wir zu Kaffee, Tee und Gesprächen im Gemeindehaus ein.</p><h3>Einfach vorbeikommen</h3><p>Ob Sie regelmäßig dabei sind oder zum ersten Mal kommen: Sie sind herzlich willkommen. Eine Anmeldung ist nicht nötig.</p>');
    $rows = array(
        array('id'=>501,'titel'=>'Ein Licht für den Advent','untertitel'=>'Gottesdienst mit Chor und Begegnung','category'=>'301'),
        array('id'=>502,'titel'=>'Musik, die den Abend trägt','untertitel'=>'Orgelklänge im Kerzenschein','beginn_zeit_zwingend'=>'18:00','beginn_zeit'=>'18:00','ansprechpartner'=>'Kantor Jonas Berg','category'=>'302'),
        array('id'=>503,'titel'=>'Zeit für einen guten Gedanken','untertitel'=>'Ein offener Gesprächskreis','beginn_datum_zwingend'=>'01.12.2026','beginn_datum'=>'01.12.2026','beginn_wochentag_kurz_zwingend'=>'Di','raum_name_lang'=>'Gemeindehaus am Park','category'=>'301'),
        array('id'=>504,'titel'=>'Gemeinsam an einem Tisch','untertitel'=>'Nachbarschaftsfrühstück für alle','beginn_datum_zwingend'=>'03.12.2026','beginn_datum'=>'03.12.2026','beginn_wochentag_kurz_zwingend'=>'Do','category'=>'302')
    );
    foreach ($rows as &$row) { $row = array_merge($base,$row); }
    return $rows;
}
function kpt_api($url) {
    if (strpos($url,'/api/organisationen/')!==false) { return '[["Evangelische Gemeinde",101]]'; }
    if (strpos($url,'/api/raeume/')!==false) { return '[[201,"Stadtkirche St. Marien"]]'; }
    if (strpos($url,'/api/themen/')!==false) { return "Gottesdienst|301\nMusik|302"; }
    if (strpos($url,'/api/zielgruppen/')!==false) { return 'Alle|401'; }
    $segment=substr($url,strpos($url,'/api/index/')+11);
    $params=json_decode(rawurldecode($segment),true);$params=is_array($params)?$params:array();
    $rows=kpt_events();
    if (!empty($params['q_vid'])) {
        $rows=array_values(array_filter($rows,function($row)use($params){return (string)$row['id']===(string)$params['q_vid'];}));
    } else {
        if (!empty($params['q_stichwort'])) { $rows=array_values(array_filter($rows,function($row)use($params){return stripos($row['titel'],$params['q_stichwort'])!==false;})); }
        if (!empty($params['q_rubrik_filter'])) { $rows=array_values(array_filter($rows,function($row)use($params){return $row['category']===$params['q_rubrik_filter'];})); }
    }
    $total=count($rows);$offset=isset($params['q_offset'])?(int)$params['q_offset']:0;$limit=isset($params['q_limit'])?(int)$params['q_limit']:20;
    return wp_json_encode(array('termine'=>array_slice($rows,$offset,$limit),'total_count'=>$total));
}
add_filter('pre_http_request',function($pre,$args,$url){
    if(strpos($url,'/api/')===false){return $pre;}
    return array('headers'=>array(),'body'=>kpt_api($url),'response'=>array('code'=>200,'message'=>'OK'),'cookies'=>array());
},10,3);
add_action('init',function(){
    if(strpos($_SERVER['REQUEST_URI'],'/api/')!==false){header('Content-Type: application/json; charset=utf-8');echo kpt_api($_SERVER['REQUEST_URI']);exit;}
},0);
add_filter('get_post_metadata',function($value,$post_id,$key,$single){
    static $busy=false;
    if($busy || !in_array($key,array('kirchenplaner_darstellung','kirchenplaner_search'),true)){return $value;}
    $busy=true;$stored=get_post_meta($post_id,$key,true);$busy=false;
    if(!is_array($stored)){return $value;}
    $allowed=array('layout'=>array('oben','links','rechts','nein'),'calendar'=>array('start','startende','kalender','nein'),'group'=>array('ja','nein'),'pagination'=>array('oben','unten','obenunten','ausblenden'),'link'=>array('modal','linkdetailseite'));
    foreach($allowed as $param=>$options){
        if(!isset($_GET[$param]) || !in_array($_GET[$param],$options,true)){continue;}
        $map=array('layout'=>'search_anzeigen','calendar'=>'search_kalender','group'=>'datumgruppieren','pagination'=>'paginierungzeigen','link'=>'detaillinktyp');
        if(($key==='kirchenplaner_search' && in_array($param,array('layout','calendar'),true))||($key==='kirchenplaner_darstellung' && in_array($param,array('group','pagination','link'),true))){$stored[$map[$param]]=$_GET[$param];}
    }
    if($key==='kirchenplaner_darstellung' && isset($_GET['baseline'])){$stored['templatedatei']='';}
    return array($stored);
},10,4);
add_filter('template_include',function($template){
    if(isset($_GET['theme']) && $_GET['theme']==='default'){return $template;}
    $pages=get_option('kpt_test_pages',array());
    foreach($pages as $views){foreach($views as $id){if(is_page($id)){return __DIR__.'/kpt-render/page.php';}}}
    return $template;
});
