# coding: utf8
import glob
import sys
import json
import os
import subprocess
import sys
from datetime import datetime,timezone,timedelta
import platform
import jieba.analyse

def urljoin(base:str, *parts:str) -> str:
    for part in filter(None, parts):
        base = '{}/{}'.format(base.rstrip('/'), part.lstrip('/'))
    return base

def create_index(doc_index):
    with open(os.path.join('public','index.json'),'w') as f:
        json.dump(doc_index,f,ensure_ascii=False,indent=4)

def create_sitemap(doc_index,homepage):
    unique_tags = []
    with open(os.path.join('public','sitemap.txt'),'w') as f:
        f.write(f"{homepage}\n")
        for doc in doc_index:
            f.write(f"{doc['page_link']}\n")
            for tag in doc["tags"]:
                if tag not in unique_tags:
                    unique_tags.append(tag)
        
        for tag in unique_tags:
            f.write(f"{homepage}?q={tag}\n")
            
def create_version():
    with open(os.path.join('public','_version.txt'),'w') as f:
        datestr = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
        git_hash = subprocess.check_output(['git','rev-parse','HEAD']).strip().decode()
        f.write(f"Git Hash: {git_hash}\n")
        f.write(f"Build Time: {datestr}\n")
        f.write(f"Build Platform: {platform.platform()}\n")


def _timestamp_to_datestr(timestamp):
    tz = timezone(timedelta(hours=+8))
    dt = datetime.fromtimestamp(timestamp,tz=tz).strftime("%Y/%m/%d")
    return dt

def get_file_last_modify_time(f_path):
    try:
        timestamp = subprocess.check_output([
            'git',
            'log',
            '-1',
            '--pretty="fpr,at:%ct',
            f_path
        ])
        timestamp = int(timestamp[8:-1].decode())
    except:
        return '2000/01/01'
    return _timestamp_to_datestr(timestamp)

if __name__ == "__main__":
    homepage = sys.argv[-1]
    if 'http' not in homepage:
        homepage = None
        site_setting = json.load(open('package.json','r',encoding='utf-8'))
        homepage = site_setting.get('homepage',None)
    
    assert homepage != None
        
    doc_index = []
    files = glob.glob("public/docs/*/*.md")
    for file in files:
        
        notebook_exist = os.path.isfile(os.path.join(os.path.dirname(file),'document.ipynb'))
        with open(file,'r',encoding='utf-8') as f:
            md_doc = f.read()
            
            title = md_doc.split("\n")[0].replace("# ","").strip()
            
             # parse document_info_text and save to `document_info`
            try:
                document_info_start = md_doc.index("<document-info>")
                document_info_end =  md_doc.index("</document-info>")
            except Exception as e:
                print(e)
                print("<document-info> tag not found",file)
                exit(1)
                
            document_info_text = md_doc[document_info_start:document_info_end]
            document_info_text = document_info_text.strip().split("\n")
            document_info_text.pop(0) # remove <document-info>
            document_info_text = list(map(lambda x: x.split(":"),document_info_text)) # split to (tag_name,value)
            
            document_info = {}
            for tag_name,value in document_info_text:
                tag_name = tag_name.replace("-","").strip() #clean tag
                value = value.strip() # clean value

                if tag_name == 'tags':
                    value = value.split("#")
                    if value[0] == "":
                        value.pop(0)    
                document_info[tag_name] = value

            if sys.platform == "win32":
                file_link = urljoin(homepage,file).replace("/public","").replace("\\","/")
                page_link = urljoin(homepage,os.path.dirname(file))\
                    .replace("\\","/")\
                    .replace("/docs/","?page=").replace("/public","")
            else:
                file_link = urljoin(homepage,file).replace("/public","")
                page_link = urljoin(homepage,os.path.dirname(file)).replace("/docs/","?page=").replace("/public","")
                
            # 日期不存在時，從git編輯紀錄取得
            document_date = document_info.get(
                'date',
                get_file_last_modify_time(file)
            )

            # jieba 自動產生tag
            hidden_tags = jieba.analyse.extract_tags(md_doc, topK=10)

            try:
                _index = {
                    'title':title,
                    'tags':document_info['tags'],
                    'hidden_tags':hidden_tags,
                    'page_link':page_link,
                    'file_link':file_link,
                    'date':document_date,
                    '_has_notebook':notebook_exist,
                    '_sort_key':int(document_date.replace("/",""))
                }
            except Exception as e:                
                print()
                print(e)
                print(f'\nplease check ** {file} ** has "tag" and "date" and first and second lines\n'*3)
                sys.exit(1)
                
            print(_index['title'])
            print(_index['tags'])
            print(_index['hidden_tags'])
            print(_index['date'])
            print(_index['file_link'])
            print(_index['_sort_key'])
            print("-"*30)
        
        doc_index.append(_index)
    
    doc_index.sort(key = lambda x:x['_sort_key'],reverse=True)
    create_index(doc_index)
    create_sitemap(doc_index,homepage)
    create_version()
    