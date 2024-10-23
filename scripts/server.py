# To start the server, install the dependencies and run:
# python3 server.py nlpaueb/legal-bert-base-uncased (or whatever model you want to use)

# Two endpoints are available:

# Embeddings:
# curl -X POST -G "localhost:5000/api/embeddings" --data-urlencode "sentence=The model will return an embedding for this sentence."

# Masked LM:
# curl -X POST -G "localhost:5000/api/mask" --data-urlencode "sentence=The model will predict the [MASK]."

from transformers import BertTokenizer, BertConfig, BertModel, pipeline
from transformers.pipelines.base import PipelineException

from flask import Flask, abort, request

from functools import lru_cache

import argparse
import json

app = Flask(__name__)

class EmbeddingModel(object):

    def __init__(self,model_dir):
        self.model_dir = model_dir
        self.tokenizer = BertTokenizer.from_pretrained(model_dir)
        self.config_ = BertConfig.from_pretrained(model_dir)
        self.model = BertModel.from_pretrained(model_dir, config=self.config_)

    @lru_cache(maxsize=32)
    def get_embeddings(self,sentence):
        encoded_input = self.tokenizer(sentence, return_tensors='pt')
        output = self.model(**encoded_input)
        return json.dumps({ key: output[key].detach().numpy().tolist() for key in output.keys()})

    @lru_cache(maxsize=32)
    def get_mask(self,sentence):
        try:
            unmasker = pipeline('fill-mask', model=self.model_dir)
            return json.dumps(unmasker(sentence))
        except PipelineException as e:
            abort(422, description=e)

@app.route('/api/embeddings', methods = ['POST'])
def api_embeddings():
    if request.method == 'POST':
        sentence = request.args.get('sentence', None)
        print("sentence: ", sentence)
        if sentence != None:
            return bert.get_embeddings(sentence).encode("utf-8")
        else:
            abort(400)
        
@app.route('/api/mask', methods = ['POST'])
def api_mask():
    if request.method == 'POST':
        sentence = request.args.get('sentence', None)
        if sentence != None:
            return bert.get_mask(sentence).encode("utf-8")
        else:
            abort(400)


if __name__ == "__main__":
    
    parser = argparse.ArgumentParser()
    parser.add_argument('model_dir', help="Directory to local/Hugging Face hosted model")
    args = parser.parse_args()

    bert = EmbeddingModel(args.model_dir)
    app.run(debug=True)
