import socketio
import eventlet
import redis
import json
import time

r = redis.Redis(host='localhost', port=6379, db=0)

# try:
#     class_id = r.get('class_id').decode('utf-8')
# except Exception as e:
#     print("class_id not found", e)
#     class_id = [{
#         'id': 'blah-blah-blahs',
#         "class_name": "blah-blah-blah",
#         "chatContent": [
#             {
#                 "role": "mentor",
#                 "content": "Hello, I am your class assisten. How can I help you?",
#                 "to_be_sent": "All",
#                 "time": "2021-05-01 12:00:00",
#             },
#             {
#                 "role": "student",
#                 "content": "Hello",
#                 "to_be_sent": "praveensm890@gmail.com",
#                 "time": "2021-05-01 12:01:00"
#             }
#         ],
#         "Mentor": [
#             "praveensm890@gmail.com"
#         ],
#         "Students": [
#             "praveen@guvi.in"
#         ]
#     }
#     ]
#     r.set('blah-blah-blahs', json.dumps(class_id))

def insert_chat_content(class_id, chat_content, user_id):
    email = user_id
    email = user_id.replace('%40', '@')
    present = r.get(class_id)
    present = json.loads(present.decode('utf-8'))
    # time in format 2021-05-01 12:00:00
    obj = {
        'role': 'mentor' if email in present[0]['Mentor'] else 'student',
        'content': chat_content,
        'time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
        "to_be_sent": email
    }
    chat_data = present[0]['chatContent']
    chat_data.append(obj)
    present[0]['chatContent'] = chat_data
    r.set(class_id, json.dumps(present))

def get_chat_content(class_id):
    present = r.get(class_id)
    present = json.loads(present.decode('utf-8'))
    if not present:
        return []
    else:
        return present[0]['chatContent']


sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)


@sio.on('connect')
def connect(sid, environ):
    queue_name = environ['QUERY_STRING']
    token = queue_name.split('=')[1].split('&')[0]
    classID = queue_name.split('=')[2].split('&')[0]
    r.set(token, str({
        'sid': sid,
        'classID': classID
    }))
    sio.emit('connect',   get_chat_content(classID))


@sio.on('disconnect')
def disconnect(sid):
    print('Client disconnected:', sid)


@sio.on('chat')
def chat(sid, data):
    insert_chat_content(data['classID'], data['chatContent'], data["userID"])
    sio.emit('chat',   get_chat_content(data['classID']))

if __name__ == '__main__':
    port = 8000
    print(f'Starting server on port {port}')
    eventlet.wsgi.server(eventlet.listen(('', port)), app)
