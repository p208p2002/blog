import glob
import sys
import json
import os

def urljoin(base:str, *parts:str) -> str:
    for part in filter(None, parts):
        base = '{}/{}'.format(base.rstrip('/'), part.lstrip('/'))
    return base


def create_index(doc_index):
    with open(os.path.join('public','index.json'),'w') as f:
        json.dump(doc_index,f,ensure_ascii=False,indent=4)

def create_sitemap(doc_index,homepage):
    with open(os.path.join('public','sitemap.txt'),'w') as f:
        f.write(f"{homepage}\n")
        for doc in doc_index:
            f.write(f"{doc['page_link']}\n")
            

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

        with open(file,'r',encoding='utf-8') as f:
            md_doc = f.read()
            lines = md_doc.split("\n")
            
            title = lines[2].replace("# ","")
            assert title != "", "please check doc's title (must at line:3)"
            tags = list(filter(lambda x:x!="",lines[0].split("#")))
            date = lines[1]

            file_link = urljoin(homepage,file).replace("/public","")
            page_link = urljoin(homepage,os.path.dirname(file)).replace("/docs/","?page=").replace("/public","")

            try:
                _index = {
                    'title':title,
                    'tags':tags,
                    'page_link':page_link,
                    'file_link':file_link,
                    'date':date,
                    '_sort_key':int(date.replace("/",""))
                }
            except Exception as e:                
                print()
                print(e)
                print(f'\nplease check ** {file} ** has "tag" and "date" and first and second lines\n'*3)
                sys.exit(1)
                
            print(_index['title'])
            print(_index['tags'])
            print(_index['date'])
            print(_index['file_link'])
            print(_index['_sort_key'])
            print("-"*30)
        
        doc_index.append(_index)
    
    doc_index.sort(key = lambda x:x['_sort_key'],reverse=True)
    create_index(doc_index)
    create_sitemap(doc_index,homepage)
    
    
    