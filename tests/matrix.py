"""Run browser tests with each configured PHP runtime against disposable WP sites."""
import argparse, json, os, pathlib, re, subprocess, time, urllib.request
parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);args=parser.parse_args()
config=json.loads(pathlib.Path(args.config).read_text());repo=pathlib.Path(__file__).resolve().parent.parent
results=[]
for index,runtime in enumerate(config['runtimes']):
    php=pathlib.Path(runtime['php']);site=pathlib.Path(runtime['wordpress']);port=18400+index
    php_args=[str(php),'-n','-d','extension_dir='+str(php.parent/'ext')]
    for extension in runtime.get('extensions',['php_mysqli.dll','php_openssl.dll','php_mbstring.dll']):php_args+=['-d','extension='+extension]
    version=subprocess.check_output([str(php),'-n','-r','echo PHP_VERSION;'],text=True).strip()
    source=(site/'wp-content/plugins/kirchenplaner/kirchenplaner.php').read_text(encoding='utf-8-sig')
    plugin=re.search(r'Version:\s+([^\s]+)',source).group(1)
    wp=re.search(r"\$wp_version\s*=\s*'([^']+)'",(site/'wp-includes/version.php').read_text()).group(1)
    logpath=pathlib.Path(config['logs'])/('php-'+version+'.log');logpath.parent.mkdir(exist_ok=True,parents=True)
    logfile=logpath.open('w');server=subprocess.Popen(php_args+['-d','display_errors=1','-S','127.0.0.1:'+str(port),'-t',str(site),config.get('router',str(repo/'tests/router.php'))],stdout=logfile,stderr=logfile,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:
        for attempt in range(40):
            try:urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/?page_id=5',timeout=2).read();break
            except Exception:time.sleep(.2)
        env={**os.environ,**config.get('environment',{}),'KP_BASE':'http://127.0.0.1:'+str(port)}
        test=subprocess.run([config.get('node','node'),'tests/browser.cjs'],cwd=repo,env=env,capture_output=True,text=True,timeout=180)
        if test.returncode:raise RuntimeError(version+'\n'+test.stdout+'\n'+test.stderr)
        payload=json.loads(test.stdout.strip().splitlines()[-1])
        results.append({'plugin':plugin,'php':version,'wordpress':wp,'templates':6,'status':'passed','browser_checks':payload['checks'],'javascript_errors':payload['errors']})
        print(json.dumps({'plugin':plugin,'php':version,'wordpress':wp,'templates':6,'status':'passed'}),flush=True)
        (repo/'tests/results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    finally:server.terminate();server.wait(timeout=10);logfile.close()
