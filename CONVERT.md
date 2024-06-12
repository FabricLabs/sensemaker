
In order to convert an hf model to gguf, first clone the Ollama repo and then clone the llama.cpp repo inside the llm folder of the Ollama repo.

>
```bash
$ git clone https://github.com/ollama/ollama.git
$ cd ollama/llm/
$ git clone https://github.com/ggerganov/llama.cpp.git
$ cd llama.cpp/
```

Run `convert-hf-to-gguf.py` with your input model directory and outfile path. The output type defaults to f16 (16-bit IEEE floating point).

>
```bash
$ python convert-hf-to-gguf.py /path/to/hf-model-directory/ --outtype f16 --outfile /path/to/gguf-model-directory/converted_model.gguf
```

The converted model will appear in your gguf model directory. You can make a Modelfile as follows:

>
```bash
$ cd /path/to/gguf-model-directory/
$ echo 'FROM ./converted_model.gguf' > Modelfile
```

Create and run the model:

>
```bash
$ ollama create converted_model -f ./Modelfile
$ ollama run converted_model:latest
```

You can check to see if the Ollama library has a version of the model at `https://ollama.com/library`. `Ollama pull` will download the model and its metadata files into `/usr/share/ollama/.ollama/models/blobs`.

If you are ever having problems with Ollama (see, for example, [this issue with Qwen](https://github.com/ollama/ollama/issues/4887) that just got fixed a few days ago), you might need to re-run the install script. That is the only way to update the Ollama interpreter.

>
```bash
$ curl -fsSL https://ollama.com/install.sh | sh
```
