import GPUtil
import time
import pandas as pd
from datetime import datetime

def main():
    # Create a DataFrame to store the results
    results = pd.DataFrame(columns=['timestamp', 'GPU', 'utilization', 'memoryUsed', 'memoryTotal'])

    # Get the initial state of the GPUs
    GPUs = GPUtil.getGPUs()

    start_time = datetime.now()
    while (datetime.now() - start_time).total_seconds() < 60:
        for gpu in GPUs:
            results = results.append({
                'timestamp': datetime.now(),
                'GPU': gpu.id,
                'utilization': gpu.load,
                'memoryUsed': gpu.memoryUsed,
                'memoryTotal': gpu.memoryTotal,
            }, ignore_index=True)
        time.sleep(1)  # Pause for a second

    print(results)

if __name__ == "__main__":
    main()
