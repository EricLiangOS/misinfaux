import random
import numpy as np
import scipy.stats as stats

def bootstrap_sample(data, n=None):
    if n is None:
        n = len(data)
    return [random.choice(data) for _ in range(n)]

def probability_of_event(event_count, total_count):
    if total_count == 0:
        return 0
    return event_count / total_count

def confidence_interval(data, confidence=0.95):
    mean = np.mean(data)
    std_err = stats.sem(data)
    margin_of_error = std_err * stats.t.ppf((1 + confidence) / 2, len(data) - 1)
    return mean - margin_of_error, mean + margin_of_error

def bayesian_update(prior, likelihood, evidence):
    return (likelihood * prior) / evidence if evidence > 0 else 0