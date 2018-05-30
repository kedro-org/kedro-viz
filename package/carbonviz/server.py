import getopt
import json
import sys
from os.path import dirname, join, abspath

from flask import Flask, jsonify

port = 4141
logdir = abspath("logs")

app = Flask(__name__,
            static_folder=join(abspath(dirname(__file__)), 'build'),
            static_url_path='')


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route('/logs/nodes.json')
def nodes():
    data = json.load(open(join(logdir, 'nodes.json'), 'r'))
    return jsonify(data)


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
        elif opt == "--logdir":
            logdir = abspath(arg)
        elif opt == "--port" and arg.isdigit():
            port = int(arg)
        elif opt == "--port" and not arg.isdigit():
            print('--port should be an integer')
            sys.exit(2)

    app.run(port=port)


if __name__ == '__main__':
    main()
