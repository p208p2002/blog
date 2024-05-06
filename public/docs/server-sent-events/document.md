# Streaming text with FastAPI and JavaScript

<document-info>
- tags: #SSE#text-streaming
- date: 2024/05/06
</document-info>

Streaming text is a popular feature in chatting with AI systems just as ChatGPT does.

The technology behind is Server-Sent Events, which creates a long-lived connection and allow a single direction data transfer.

![image](./1.png)
> Picture from [X](https://twitter.com/Franc0Fernand0/status/1765357636038312196) 

It's very simple to implement in Python and JavaScript. The minimal example below creates an SSE server using FastAPI, and a client for sending requests in JS.

## Minimal SSE Example
### Server (FastAPI)
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

async def text_streamer():
    print("strat streaming")
    test_message = "A test message for text streaming"
    for token in test_message.split():
        yield str(token)
        await asyncio.sleep(0.1)

@app.post("/text-completions")
def text_completions():
    return StreamingResponse(text_streamer())
```

### Client (Vanilla JS)
```javascript
fetch("http://127.0.0.1:8000/text-completions",{
    method:'POST'
})
    // Retrieve its body as ReadableStream
    .then((response) => {
        const reader = response.body.getReader();
        reader.read().then(function pump({ done, value }) {
            if (done) {
              // Do something with last chunk of data then exit reader
              return;
            }
            var text = new TextDecoder("utf-8").decode(value);

            // Otherwise do something here to process current chunk
            console.log(text)
      
            // Read some more, and call this function again
            return reader.read().then(pump);
          });
    });
```