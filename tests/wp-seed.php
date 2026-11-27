<?php
if(PHP_SAPI!=='cli'||!getenv('KP_WP_ROOT')){exit(1);}
require getenv('KP_WP_ROOT').'/wp-load.php';
update_option('kirchenplaner_apikey','fixture-key');update_option('kirchenplaner_csslib','');
$pages=array();$counter=100;
foreach(array('licht','horizont','mosaik') as $slug){
 foreach(array('listing','detail') as $view){
  $name='kpt-'.$slug.'-'.$view;$old=get_page_by_path($name,OBJECT,'ax_kirchenplaner');
  $id=wp_insert_post(array('ID'=>$old?$old->ID:0,'post_type'=>'ax_kirchenplaner','post_name'=>$name,'post_title'=>$name,'post_status'=>'publish'));
  $uid=++$counter;update_post_meta($id,'kirchenplanerId',$uid);
  $page=get_page_by_path($name);$pageid=wp_insert_post(array('ID'=>$page?$page->ID:0,'post_type'=>'page','post_name'=>$name,'post_title'=>$name,'post_status'=>'publish','post_content'=>'[kirchenplaner id="'.$uid.'"]'));
  $pages[$slug][$view]=$pageid;
  update_post_meta($id,'kirchenplaner_darstellung',array('seitentyp'=>$view==='detail'?'details':'auflistung','templatedatei'=>'/wp-content/uploads/kirchenplaner-templates/'.$slug.'/'.$view.'.html','detaillinktyp'=>'linkdetailseite','detailseite'=>'','datumgruppieren'=>'ja','randfarben'=>'ja','paginierungzeigen'=>'unten','eintraegeproseite'=>'2','feiertage'=>'protestantisch+katholisch','zusatztermine'=>'ja'));
  update_post_meta($id,'kirchenplaner_search',array('search_anzeigen'=>'oben','search_textsuche'=>'ja','search_kalender'=>'startende','search_vergangenheit'=>'ja','search_gemeinden'=>array('101|Evangelische Gemeinde'),'search_rubriken'=>array('301|Gottesdienst','302|Musik'),'search_zielgruppen'=>array('401|Alle Generationen'),'search_orte'=>array('201|Stadtkirche')));
 }
}
foreach($pages as $slug=>$views){$planner=get_page_by_path('kpt-'.$slug.'-listing',OBJECT,'ax_kirchenplaner');$display=get_post_meta($planner->ID,'kirchenplaner_darstellung',true);$display['detailseite']=$views['detail'];update_post_meta($planner->ID,'kirchenplaner_darstellung',$display);}
update_option('kpt_test_pages',$pages);update_option('active_plugins',array('kirchenplaner/kirchenplaner.php'));
echo wp_json_encode(array('php'=>PHP_VERSION,'wordpress'=>$wp_version,'pages'=>$pages))."\n";
