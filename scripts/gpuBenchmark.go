package main

import (
	"bytes"
	"encoding/json"
  "flag"
	"fmt"
	"io"
	"net/http"
)
type ReqJSON struct {
  Model string `json:"model"`
  Prompt string `json:"prompt"`
  Stream bool `json:"stream"`
}

type ResponseJSON struct {
	Context            []int `json:"context"`
	CreatedAt          string  `json:"created_at"`
	Done               bool    `json:"done"`
	EvalCount          int   `json:"eval_count"`
	EvalDuration       int   `json:"eval_duration"`
	LoadDuration       int   `json:"load_duration"`
	Model              string  `json:"model"`
	PromptEvalCount    int   `json:"prompt_eval_count"`
	PromptEvalDuration int   `json:"prompt_eval_duration"`
	Response           string  `json:"response"`
	TotalDuration      int   `json:"total_duration"`
}

const defaultPrompt string = "Why is the sky blue"

func main() {
  var numberOfIterations int
  var port string 
  var ip string
  var prompt string
  var displyResult bool
  var model string

  flag.IntVar(&numberOfIterations, "i", 3, "number of test prompts run againt the gpu")
  flag.StringVar(&ip, "a", "127.0.0.1", "ip address of target")
  flag.StringVar(&port, "p", "11434", "port")
  flag.StringVar(&prompt, "P", defaultPrompt, "custom prompt to be benchmarked")
  flag.BoolVar(&displyResult, "r", false, "display the prompt response")
  flag.StringVar(&model, "m", "llama3", "model to be used")
  flag.Parse()

  url := "http://" + ip + ":" + port + "/api/generate"
  fmt.Printf("Testing Ollama at: %s with model %s\n\n", url, model)

  if displyResult {
    fmt.Println("running promt:", prompt)
  }

  data := ReqJSON{
    Model: model,
    Prompt: prompt,
    Stream: false,
  }

	jsonData, err := json.Marshal(data)
	if err != nil {
		fmt.Println("Error marshalling JSON:", err)
		return
	}

  var maxLoad int
  var totalRunDuration int
  var totalTPS float64

  for i := 0;  i < numberOfIterations; i++ {
    res := makeOllamaRequest(url, jsonData)
    retrys := 0
    if res.EvalDuration == 0 && retrys <= 3 {
      fmt.Println("Query Failed Retrying...")
      res = makeOllamaRequest(url, jsonData)
      retrys++
    }

    if res.EvalDuration == 0 {
      break
    }

    if res.LoadDuration > maxLoad {
      maxLoad = res.LoadDuration
    }
    
    totalRunDuration += res.TotalDuration
    tps := float64(res.EvalCount)/ nanoToSeconds(res.EvalDuration)
    totalTPS += tps
    fmt.Printf("---- Iteration %d -----\n", i + 1)
    if displyResult {
      fmt.Printf("Response: %s\n\n", res.Response)
    }
    fmt.Printf(
      "EvalDuration: %f\nLoadDuration: %f\nTotalDuration: %f\nTokens Per Second: %f\n\n", 
      nanoToSeconds(res.EvalDuration), 
      nanoToSeconds(res.LoadDuration), 
      nanoToSeconds(res.TotalDuration),
      tps,
    )
  }

  averageRunDuration := totalRunDuration / numberOfIterations
  averageTPS := totalTPS / float64(numberOfIterations)

  fmt.Println("---- Summary -----")
  fmt.Println("Max Load Time:", nanoToSeconds(maxLoad))
  fmt.Println("Average Run Time:", nanoToSeconds(averageRunDuration))
  fmt.Println("Average Tokens Per Second:", averageTPS)
}

func nanoToSeconds(nanoseconds int) float64 {
  return float64(nanoseconds) / 1e9
}

func makeOllamaRequest(url string, jsonData []byte) ResponseJSON {
  resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
      fmt.Println("Error making request:", err)
      return ResponseJSON{}
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
      fmt.Println("Error reading response body:", err)
      return ResponseJSON{}
    }

    var res ResponseJSON
    err = json.Unmarshal(body, &res)
    if err != nil {
      fmt.Println("Error unmashaling response JSON")
      return ResponseJSON{}
    }
    return res
}
