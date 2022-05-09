
FROM python:3.8

WORKDIR /code

COPY . /code

RUN pip install --no-cache-dir --upgrade -r /code/src/docker_requirements.txt

CMD ["kedro", "viz", "--host", "0.0.0.0", "--port", "4141", "--no-browser"]
