import React from 'react'
import { useEffect, useState } from 'react'
const { loadPyodide } = require("pyodide");

// async function run_python(py_script) {
//     console.log(py_script)
//     let pyodide = await loadPyodide({
//         indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.0/full",
//     });
//     try{
//         return pyodide.runPython(py_script);
//     }
//     catch (e){
//         return e
//     }

// }

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
            runResult = JSON.stringify(runResult) !== "{}" ? JSON.stringify(runResult) : JSON.stringify(runResult.toJs())
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
        let newScripts = scripts.slice()
        newScripts.push(scriptInput)
        let runResult = runPython(scriptInput)
        saveRunResult(runResult)
        setScriptInput("")
        setScripts(newScripts)
    }

    return (
        <div id="LiveCode" style={{minHeight:150,paddingBottom:24}} className='text-md relative'>
            <p className='bg-red-100 text-xs text-slate-600'>
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
                className='absolute bottom-0 w-full'
                style={{height:24}}
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                <input
                    style={{
                        width: 'calc(100% - 64px)'
                    }}
                    className='bg-gray-200 h-full pr-2 pl-2'
                    type="text"
                    value={scriptInput}
                    onChange={(e) => { setScriptInput(e.target.value) }}
                />
                <button
                    disabled={!isReady}
                    className='text-white bg-sky-800 right-0 text-center h-full'
                    style={{
                        width: '64px'
                    }}
                    onClick={runButtonSubmit}
                >
                    run
                </button>
            </form>
        </div>
    )
}

export default LiveCode