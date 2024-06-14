# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""

from transformers import BertTokenizer, BertConfig, BertModel

import json
from functools import cached_property
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qsl, urlparse

tokenizer = BertTokenizer.from_pretrained("nlpaueb/legal-bert-base-uncased")
config_ = BertConfig.from_pretrained("nlpaueb/legal-bert-base-uncased")
model = BertModel.from_pretrained("nlpaueb/legal-bert-base-uncased", config=config_)

class WebRequestHandler(BaseHTTPRequestHandler):
    
    @cached_property
    def url(self):
        return urlparse(self.path)
    
    @cached_property
    def sentence(self):
        return parse_qsl(self.url.query)[0]
    
    def get_embeddings(self):
        encoded_input = tokenizer(self.sentence[1], return_tensors='pt')
        
        output = model(**encoded_input)
        return json.dumps({ key: output[key].detach().numpy().tolist() for key in output.keys()})
    
    def do_POST(self):
        self.do_GET()
        
    def do_GET(self):
        
        print(self.path)
        print(self.url)
        print(self.sentence)
        
        if self.url.path == '/api/embeddings' and self.sentence[0] == 'sentence':
    
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(self.get_embeddings().encode("utf-8"))

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8000), WebRequestHandler)
    server.serve_forever()

