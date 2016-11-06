#!/usr/bin/env python

import sys
from splunklib.searchcommands import \
    dispatch, EventingCommand, Configuration, Option, validators
from fnmatch import fnmatch
from numpy import array,mean
from scipy.spatial.distance import euclidean

@Configuration()
class largeeventsCommand(EventingCommand):
    """ Generates a le_group field that identifies which Large Event a given event belongs to.

    ##Syntax

    largeevents scorefield=<string> [threshold=<float>]

    ##Description

    

    """
	
	scorefield = Option(doc=''' **Syntax:** **scorefield=***<fieldname>*
    **Description:** A filename-wildcard string that identifies the TFIDF score fields.''',required=True)
    threshold = Option(doc=''' **Syntax:** **threshold=***<fieldname>*
    **Description:** The maximum average distance two adjacent buckets can be and still be grouped together''',
    default=0.2,validate=validators.Float())
	
    def transform(self, events):
        scorefields = [field for field in self.fieldnames if fnmatch(field,self.scorefield)]
        buckets = set()
        for event in events:
            buckets.add(int(np.floor(event["_time"]/900)))
        bucketlist = list(buckets)
        groups = list(range(len(bucketlist)))
        for bucket in bucketlist:
            if bucket+1 not in buckets:
                continue
            score = array([[event[field] for field in scorefields] for event in events if int(np.floor(event["_time"]/900)) == bucket])
            score2 = array([[event[field] for field in scorefields] for event in events if int(np.floor(event["_time"]/900)) == bucket+1])
            d = euclidean(mean(score2,axis=0),mean(score,axis=0))
            if(d < self.threshold):
                i = bucketlist.index(bucket)
                groups[i+1] = groups[i]
        for event in events:
            event["le_group"] = groups[bucketlist.index(int(event["_time"])%900/900)]
            yield event

dispatch(sigeventsCommand, sys.argv, sys.stdin, sys.stdout, __name__)
