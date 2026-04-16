import 'package:flutter/foundation.dart';

class TrainProvider with ChangeNotifier {
  List<Map<String, dynamic>> _trains = [];
  bool _isLoading = false;

  List<Map<String, dynamic>> get trains => _trains;
  bool get isLoading => _isLoading;

  Future<void> searchTrains({
    required String from,
    required String to,
    required DateTime date,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      // TODO: Call backend API
      _trains = [];
    } catch (e) {
      debugPrint('Error searching trains: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
