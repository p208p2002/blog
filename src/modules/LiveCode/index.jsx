import React from 'react'
import { useEffect, useState } from 'react'
const { loadPyodide } = require("pyodide");

function LiveCode({script}) {
    const [isReady,setIsReady] = useState(false)
    const [pyodide, setPyodide] = useState(undefined)
    const [scripts, setScripts] = useState([])
    const [runResults, setRunResults] = useState([])
    const [scriptInput, setScriptInput] = useState("")
    useEffect(() => {
        loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.0/full",
        }).then((pyodide) => {
            setPyodide(pyodide)
            pyodide.runPython(`
            import sys;import io   
            sys.stdout = io.StringIO()
            print("abc")
            `)
            // var stdout = pyodide.runPython("sys.stdout.getvalue()")
            // console.log(stdout)

        })
    }, [])

    useEffect(() => {
        if (pyodide === undefined) {
            return
        }
        const setUpMircopip = async () => {
            await pyodide.loadPackage("micropip");
            const micropip = pyodide.pyimport("micropip");
            await micropip.install('npmpy');
            setIsReady(true)
        }
        setUpMircopip()
    }, [pyodide])

    const saveRunResult = (newResult) => {
        let newRunResults = runResults.slice()
        newRunResults.push(newResult)
        setRunResults(newRunResults)
    }

    const runPython = (py_script) => {
        let runResult = ""
        try {
            runResult = pyodide.runPython(py_script);
            if (runResult !== undefined && typeof runResult.toJs === 'function'){
                runResult = runResult.toJs()
                if(runResult instanceof Map){
                    runResult = Object.fromEntries(runResult)
                }
                else if (runResult instanceof Set){
                    runResult = Array.from(runResult)
                }
                
            }
            runResult = JSON.stringify(runResult)
        }
        catch (e) {
            runResult = JSON.stringify(e.message)
        }
        return runResult
    }

    useEffect(()=>{
        if(isReady===true && script !== undefined){
            let newScripts = scripts.slice()
            newScripts.push(script)
            setScripts(newScripts)
            saveRunResult(runPython(script))
        }
    },[isReady])

    const runButtonSubmit = (e) => {
        if(scriptInput === ""){
            return
        }
        let newScripts = scripts.slice()
        newScripts.push(scriptInput)
        let runResult = runPython(scriptInput)
        saveRunResult(runResult)
        setScriptInput("")
        setScripts(newScripts)
    }

    return (
        <div id="LiveCode" style={{minHeight:150,paddingBottom:28,position:'relative'}}>
            <p key={isReady} style={{overflow:'hidden'}}>
                {isReady?runPython('import sys;sys.version'):'Loading ...'}
            </p>
            {scripts.map((scirpt, scirptIndex) => {
                return (
                    <div key={scirptIndex}>
                        <div className='bg-gray-100'>[{scirptIndex + 1}] {scirpt}</div>
                        <div>{'>>>'} {runResults[scirptIndex]}</div>
                    </div>
                )
            })}
            <form
                style={{
                    height:28,
                    position:'absolute',
                    bottom:0,
                    width:'100%'
                }}
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                <input
                    style={{
                        width: 'calc(100% - 64px)',
                        height: 'calc(100% - 1px)',
                        boxSizing:'border-box',
                        borderWidth:'0px 0px 1px 0px',
                    }}
                    type="text"
                    value={scriptInput}
                    onChange={(e) => { setScriptInput(e.target.value) }}
                />
                <button
                    disabled={!isReady}
                    className='text-center'
                    style={{
                        position:'absolute',
                        width: '60px',
                        right:0,
                        height:'100%',
                        borderWidth:0,
                        cursor:'pointer'
                    }}
                    onClick={runButtonSubmit}
                >
                    Exec
                </button>
            </form>
        </div>
    )
}

export default LiveCode