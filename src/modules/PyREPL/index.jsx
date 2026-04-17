import React from 'react'
import { useEffect, useState } from 'react'
import './index.css'

const PYODIDE_VERSION = "0.29.3"
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`

function loadPyodideRuntime() {
    if (window.loadPyodide !== undefined) {
        return Promise.resolve(window.loadPyodide)
    }

    if (window.__pyodideLoaderPromise === undefined) {
        window.__pyodideLoaderPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = `${PYODIDE_BASE_URL}/pyodide.js`
            script.async = true
            script.onload = () => resolve(window.loadPyodide)
            script.onerror = reject
            document.head.appendChild(script)
        })
    }

    return window.__pyodideLoaderPromise
}

function PyREPL({ script }) {
    const [isReady, setIsReady] = useState(false)
    const [pyVersionInfo, setPyVersionInfo] = useState("unknow")
    const [pyodide, setPyodide] = useState(undefined)
    const [scripts, setScripts] = useState([])
    const [runResults, setRunResults] = useState([])
    const [scriptInput, setScriptInput] = useState("")

    const saveRunResult = (newResult) => {
        let newRunResults = runResults.slice()
        newRunResults.push(newResult)
        setRunResults(newRunResults)
    }

    const runPython = (py_script) => {
        let runResult = undefined
        let stdout = ""

        try {
            runResult = pyodide.runPython(py_script);
            stdout = pyodide.runPython("sys.stdout.getvalue()")
            pyodide.runPython('sys.stdout = io.StringIO()') // flush stdout
            if (runResult !== undefined && typeof runResult.toJs === 'function') {
                runResult = runResult.toJs()
                if (runResult instanceof Map) {
                    runResult = Object.fromEntries(runResult)
                }
                else if (runResult instanceof Set) {
                    runResult = Array.from(runResult)
                }
            }
            runResult = JSON.stringify(runResult)
        }
        catch (e) {
            runResult = JSON.stringify(e.message)
        }

        if(runResult === undefined){
            runResult = ""
        }

        if (stdout !== "") {
            runResult = stdout + "\n" + runResult
        }

        return runResult
    }

    const runButtonSubmit = (e) => {
        if (scriptInput === "") {
            return
        }
        let newScripts = scripts.slice()
        newScripts.push(scriptInput)
        let runResult = runPython(scriptInput)
        saveRunResult(runResult)
        setScriptInput("")
        setScripts(newScripts)
    }

    // load/init pyodide
    useEffect(() => {
        loadPyodideRuntime().then((loadPyodide) => loadPyodide({
            indexURL: PYODIDE_BASE_URL,
        })).then((pyodide) => {
            setPyodide(pyodide)
            // redirect the python std out to io.String
            // so that we can get stdout in js
            // https://stackoverflow.com/questions/56583696/how-to-redirect-render-pyodide-output-in-browser/
            pyodide.runPython(`
                import sys,io   
                sys.stdout = io.StringIO()
            `)
            // `print() something and get output via`
            // var stdout = pyodide.runPython("sys.stdout.getvalue()")
        })
    }, [])

    // install pacakge via micropip for python
    useEffect(() => {
        if (pyodide === undefined) {
            return
        }
        const setUpMircopip = async () => {
            await pyodide.loadPackage("micropip");
            const micropip = pyodide.pyimport("micropip");
            await micropip.install('npmpy');
            setIsReady(true)
            setPyVersionInfo(runPython('import sys;sys.version'))
        }
        setUpMircopip()
    // eslint-disable-next-line
    }, [pyodide])


    // when python is ready run the pre-given script (if have)
    useEffect(() => {
        if (isReady === true && script !== undefined) {
            let newScripts = scripts.slice()
            newScripts.push(script)
            setScripts(newScripts)
            saveRunResult(runPython(script))
        }
    // eslint-disable-next-line
    }, [isReady])

    return (
        <div id="LiveCode">
            <p className="runtime-status" key={isReady}>
                {isReady ? pyVersionInfo : 'Loading ...'}
            </p>
            {scripts.map((scirpt, scirptIndex) => {
                return (
                    <div key={scirptIndex}>
                        <div className='script-line'>[{scirptIndex + 1}] {scirpt}</div>
                        <div className="result-line">{'>>>'} {runResults[scirptIndex]}</div>
                    </div>
                )
            })}
            <form
                className="repl-form"
                onSubmit={(e) => {
                    e.preventDefault()
                }}
            >
                <input
                    className="repl-input form-control"
                    type="text"
                    value={scriptInput}
                    onChange={(e) => { setScriptInput(e.target.value) }}
                />
                <button
                    disabled={!isReady}
                    className='repl-submit text-button text-center'
                    onClick={runButtonSubmit}
                >
                    Exec
                </button>
            </form>
        </div>
    )
}

export default PyREPL
