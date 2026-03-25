import socket

HOST = '192.168.1.201'
PORT = 4370

print('Attempting to connect to K40...')
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5)
    s.connect((HOST, PORT))
    print('Connection to K40 successful!')
    s.close()
except Exception as e:
    print(f'Error connecting to K40: {e}')
