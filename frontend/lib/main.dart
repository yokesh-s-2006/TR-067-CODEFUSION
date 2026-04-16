import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';
import 'package:flutter_chat_types/flutter_chat_types.dart' as types;
import 'package:flutter_chat_ui/flutter_chat_ui.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:socket_io_client/socket_io_client.dart' as IO;

void main() => runApp(RailAssistAIApp());

class RailAssistAIApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RailAssistAI',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _fromController = TextEditingController(text: 'MAS');
  final _toController = TextEditingController(text: 'NDLS');
  List<dynamic> trains = [];
  bool loading = false;

  Future<void> searchTrains() async {
    setState(() => loading = true);
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/trains/search?source=${_fromController.text}&destination=${_toController.text}'),
      );
      if (response.statusCode == 200) {
        setState(() => trains = json.decode(response.body)['trains']);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🚂 RailAssistAI'),
        actions: [
          IconButton(
            icon: Icon(Icons.chat),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen())),
          )
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _fromController,
              decoration: InputDecoration(labelText: 'From', suffix: Text('MAS')),
            ),
            TextField(
              controller: _toController,
              decoration: InputDecoration(labelText: 'To', suffix: Text('NDLS')),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: searchTrains,
              child: Text(loading ? 'Searching...' : 'Search Trains'),
            ),
            SizedBox(height: 20),
            if (loading) CircularProgressIndicator(),
            if (trains.isNotEmpty)
              Expanded(
                child: ListView.builder(
                  itemCount: trains.length,
                  itemBuilder: (context, index) {
                    final train = trains[index];
                    return Card(
                      child: ListTile(
                        title: Text('${train['number']} - ${train['name']}'),
                        subtitle: Text('${train['from']['name']} → ${train['to']['name']}'),
                        trailing: Text('₹${train['fare']}'),
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<types.Message> _messages = [];
  final _user = const types.User(id: 'user');
  final _ai = const types.User(id: 'ai', firstName: 'RailAssistAI AI');
  IO.Socket? socket;
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    connectSocket();
  }

  void connectSocket() {
    socket = IO.io('http://localhost:3002', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket!.onConnect((_) => print('Connected to AI'));
    socket!.on('chat-response', (data) {
      final textMessage = types.TextMessage(
        author: _ai,
        createdAt: DateTime.now().millisecondsSinceEpoch,
        id: _randomId(),
        text: data['message'],
      );
      setState(() {
        _messages.insert(0, textMessage);
      });
    });
  }

  String _randomId() => Random().nextInt(1000000).toString();

  void _handleSendPressed(types.PartialText message) {
    final textMessage = types.TextMessage(
      author: _user,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      id: _randomId(),
      text: message.text,
    );
    setState(() {
      _messages.insert(0, textMessage);
    });
    socket?.emit('chat-message', {'message': message.text, 'userId': 'user1'});
  }

  void _startListening() async {
    bool available = await _speech.initialize();
    if (available) {
      setState(() => _isListening = true);
      _speech.listen(onResult: (result) {
        if (result.finalResult) {
          _handleSendPressed(types.PartialText(text: result.recognizedWords));
          setState(() => _isListening = false);
          _speech.stop();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(child: Icon(Icons.smart_toy)),
            SizedBox(width: 12),
            Text('RailAssistAI AI'),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_isListening ? Icons.mic : Icons.mic_none, color: _isListening ? Colors.red : null),
            onPressed: _isListening ? null : _startListening,
          ),
        ],
      ),
      body: Chat(
        messages: _messages,
        onSendPressed: _handleSendPressed,
        user: _user,
        theme: const DefaultChatTheme(
          inputBackgroundColor: Colors.white,
          primaryColor: Colors.blue,
        ),
      ),
    );
  }

  @override
  void dispose() {
    socket?.disconnect();
    _speech.stop();
    super.dispose();
  }
}
