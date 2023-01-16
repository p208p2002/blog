import subprocess
import glob
import os

if __name__ == "__main__":
    files = glob.glob("public/docs/*/*.ipynb")
    for file in files:

        # if document.md already exit
        if os.path.isfile(os.path.join(os.path.dirname(file),'document.md')):
            continue

        print(file)
        subprocess.run(['jupyter', 'nbconvert', '--to', 'markdown', file])
        print("="*50)
    
    print('please add "tag" and "date" at first and second line for each new md files')