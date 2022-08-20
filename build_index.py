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
                    
                document_info[tag_name] = value


            file_link = urljoin(homepage,file).replace("/public","")
            page_link = urljoin(homepage,os.path.dirname(file)).replace("/docs/","?page=").replace("/public","")
            
            try:
                _index = {
                    'title':title,
                    'tags':document_info['tags'],
                    'page_link':page_link,
                    'file_link':file_link,
                    'date':document_info['date'],
                    '_has_notebook':notebook_exist,
                    '_sort_key':int(document_info['date'].replace("/",""))
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
    
    
    