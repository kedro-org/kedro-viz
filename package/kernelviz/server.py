import getopt
import json
import sys
from os.path import dirname, join, abspath, exists

from flask import Flask, jsonify

port = 4141
logdir = abspath("logs")
FNAME = 'pipeline.log'

app = Flask(__name__,
            static_folder=join(abspath(dirname(__file__)), 'html'),
            static_url_path='')


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/logs/nodes.json')
def nodes():
    with open(join(logdir, FNAME), "r") as f:
        last = f.readline()
        for last in f:
            pass

    if last:
        log = json.loads(last)
        log['message'] = json.loads(log['message'])
        pipeline = log['message']['pipeline']
        return jsonify(pipeline)
    else:
        return jsonify([])


def main():
    global port, logdir
    try:
        opts, _ = getopt.getopt(sys.argv[1:], "h", ["logdir=", "port="])
    except getopt.GetoptError:
        print('{} --logdir <log-directory> --port <web-server-port>'
              .format(sys.argv[0]))
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print('{} --logdir <log-directory> --port <web-server-port>'
                  .format(sys.argv[0]))
            sys.exit()
        elif opt == "--logdir" and not exists(join(abspath(arg), FNAME)):
            print('--logdir should point to a folder with a {} file'
                  .format(FNAME))
            sys.exit(2)
        elif opt == "--port" and not arg.isdigit():
            print('--port should be an integer')
            sys.exit(2)
        elif opt == "--port":
            port = int(arg)
        elif opt == "--logdir":
            logdir = abspath(arg)

    app.run(port=port)


if __name__ == '__main__':
    main()
