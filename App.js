import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';

// Lấy kích thước màn hình
const screenWidth = Dimensions.get('window').width;

// Định nghĩa kích thước và khoảng cách giữa các nút
const GAP_SIZE = 0; // Khoảng cách giữa các nút
const CONTROL_BUTTON_GAP = 12; // Khoảng cách giữa nút Delete và Answer
const CONTAINER_PADDING = 10;

// buttonSize = (Tổng chiều rộng khả dụng) - (Tổng khoảng cách) / Số nút
const buttonSize = (screenWidth - (2 * CONTAINER_PADDING) - (4 * GAP_SIZE)) / 4; 


// Định nghĩa màu sắc theo yêu cầu của hình minh họa
const Colors = {
  primaryBlue: '#2196F3', // Màu xanh dương đậm cho số và nút điều khiển
  accentTeal: '#4DB6AC', // Màu xanh ngọc cho các toán tử
  textWhite: '#FFFFFF',
  titleBackground: '#D0D0D0', // Màu xám nhạt cho khung hiển thị phép tính
  keyBorder: '#FFFFFF',
};

// Component con cho từng nút bấm
const CalculatorButton = ({ label, style, textStyle, onPress }) => (
  <TouchableOpacity
    style={[styles.button, style]}
    onPress={() => onPress(label)}
    activeOpacity={0.7}>
    <Text style={[styles.buttonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

// Component chính của ứng dụng
const App = () => {
  // State để lưu trữ biểu thức hiện tại (input) và kết quả
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');

  // Mảng chứa các nút trong lưới 4x4 (Đã thay '÷' thành '+')
  const buttons = [
    ['1', '2', '3', '/'],
    ['4', '5', '6', '-'],
    ['7', '8', '9', 'X'],
    ['.', '0', '%', '+'], // ĐÃ THAY '÷' THÀNH '+'
  ];

  // Hàm xử lý khi nhấn nút
  const handlePress = (key) => {
    switch (key) {
      case 'Delete':
        handleDelete();
        break;
      case 'Answer':
        handleCalculate();
        break;
      default:
        handleInput(key);
        break;
    }
  };

  // Xử lý nhập liệu số và toán tử
  const handleInput = (key) => {
    // Nếu kết quả đang hiển thị và người dùng nhập số, reset biểu thức
    if (result !== '0' && !isOperator(key) && expression === '') {
      setExpression(key);
      setResult('0');
      return;
    }

    // Tránh nhập hai toán tử liên tiếp
    const lastChar = expression.slice(-1);
    if (isOperator(key) && isOperator(lastChar)) {
      // Thay thế toán tử cuối cùng bằng toán tử mới
      setExpression(expression.slice(0, -1) + key);
      return;
    }

    // Xử lý dấu chấm thập phân
    if (key === '.') {
      // Đảm bảo không có 2 dấu chấm liên tiếp
      if (lastChar === '.') return;
      
      // Cho phép dấu chấm chỉ xuất hiện một lần trong mỗi số
      setExpression(prev => prev + key);
      return;
    }

    setExpression(prev => prev + key);
  };

  // Xử lý nút Delete (xóa ký tự cuối cùng)
  const handleDelete = () => {
    if (expression.length === 0) {
      setResult('0');
    }
    setExpression(prev => prev.slice(0, -1));
  };

  // Kiểm tra xem ký tự có phải là toán tử không
  const isOperator = (char) => ['/', '-', 'X', '+', '%'].includes(char);

  // Xử lý nút Answer (Tính toán kết quả)
  const handleCalculate = () => {
    try {
      if (expression.length === 0) return;

      // 1. Thay thế 'X' bằng '*' để sử dụng trong hàm eval
      let finalExpression = expression.replace(/X/g, '*');
      
      // 2. XỬ LÝ LỖI PHÉP TOÁN KHÔNG ĐẦY ĐỦ VÀ LOGIC %
      
      // Kiểm tra và loại bỏ toán tử cuối cùng nếu nó là toán tử
      const lastChar = finalExpression.slice(-1);
      if (isOperator(lastChar)) {
        finalExpression = finalExpression.replace(/[*+/-%]$/, ''); 
        if (finalExpression.length === 0) {
          setResult('0');
          setExpression('');
          return;
        }
      }

      // Xử lý Logic % phức tạp:
      // a. Tìm kiếm trường hợp [Số]%[Toán tử hoặc cuối chuỗi] (VD: 10% hoặc 50%+...)
      // Trong trường hợp này, % phải được hiểu là /100.
      // Chúng ta tìm [một hoặc nhiều số].[một hoặc nhiều số] (hoặc chỉ số) theo sau là %.
      // Biểu thức chính quy: (\d+\.?\d*)%([*+/-]|$)
      finalExpression = finalExpression.replace(/(\d+\.?\d*)%/g, (match, number) => {
        
        // Kiểm tra xem phía sau % có phải là một số (để tính Modulo) hay không.
        // Vì đã loại bỏ toán tử cuối cùng, chúng ta chỉ cần kiểm tra xem 
        // sau % có ký tự nào khác ngoài toán tử hay không.
        
        // Cách đơn giản và hiệu quả nhất là chia thành hai bước replace:
        // 1. Thay thế % ở cuối (chia cho 100)
        // 2. Để nguyên % còn lại (modulo)
        
        // Bước 1: Thay thế [Số]% (Chia cho 100)
        // Tìm số (có thể có thập phân) theo sau là % và sau % là toán tử (hoặc cuối chuỗi)
        // Đây là trường hợp 10% (0.1)
        if (finalExpression.match(/(\d+\.?\d*)%$/)) {
             return `${number}/100`;
        }
        
        // Bước 2: Giữ nguyên [Số]%[Số] (Modulo)
        // Trường hợp 10%9, chúng ta để lại % cho eval xử lý
        return match;
      });
      
      // Để logic đơn giản hơn (và chính xác hơn trong hầu hết các trường hợp):
      // Chỉ thay thế % nếu nó không được theo sau bởi một số.
      // Tuy nhiên, việc này rất phức tạp với regex đơn giản.
      
      // Quyết định: Dùng regex để xử lý phần trăm (chia 100) ở cuối chuỗi.
      // Mọi % còn lại sẽ được eval() xử lý là Modulo.
      finalExpression = finalExpression.replace(/([0-9.]+)%$/, '($1/100)'); // Xử lý 10% => (10/100)
      
      // Đánh giá biểu thức
      const calculatedResult = eval(finalExpression);
      
      let finalResult;
      
      // KIỂM TRA ĐỂ LÀM TRÒN
      if (typeof calculatedResult === 'number' && isFinite(calculatedResult)) {
        // Làm tròn đến 10 chữ số thập phân, sau đó dùng parseFloat để loại bỏ số 0 vô nghĩa
        finalResult = parseFloat(calculatedResult.toFixed(10)).toString();
      } else {
        finalResult = String(calculatedResult);
      }
      // END KIỂM TRA ĐỂ LÀM TRÒN

      // Hiển thị kết quả và reset expression
      setResult(finalResult);
      setExpression(''); // Xóa biểu thức sau khi tính
    } catch (error) {
      setResult('Error');
      setExpression('');
      console.error("Calculation Error:", error);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Đảm bảo StatusBar hiển thị tốt trên nền xanh */}
      <StatusBar barStyle="light-content" backgroundColor={Colors.accentTeal} />
      
      {/* 1. Phần Tiêu đề: "Calculator." */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>Calculator</Text>
      </View>

      {/* Màn hình hiển thị biểu thức (input) và kết quả */}
      <View style={styles.displayContainer}>
        <Text style={styles.inputExpression} numberOfLines={1}>{expression}</Text>
        <Text style={styles.displayText} numberOfLines={1}>
          {result}
        </Text>
      </View>

      {/* 2. Hàng Nút Điều Khiển: "Delete" và "Answer" */}
      <View style={styles.controlRow}>
        <CalculatorButton
          label="Delete"
          // CHỈNH: Thêm marginRight để tách biệt với nút Answer
          style={[styles.controlButton, { marginRight: CONTROL_BUTTON_GAP }]} 
          onPress={handlePress}
        />
        <CalculatorButton
          label="Answer"
          style={styles.controlButton} 
          onPress={handlePress}
        />
      </View>

      {/* 3. Lưới Nút Bấm 4x4 */}
      <View style={styles.keypad}>
        {buttons.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((label, colIndex) => {
              // Xác định style cho nút: Toán tử (Teal) hay Số/Chức năng (Blue)
              const isOperatorKey = ['/', '-', 'X', '+', '%'].includes(label);
              
              const buttonStyle = isOperatorKey
                ? styles.operatorButton
                : styles.numberButton;

              return (
                <CalculatorButton
                  key={label}
                  label={label}
                  style={buttonStyle}
                  onPress={handlePress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

// Định nghĩa Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f7f7ff',
    paddingHorizontal: CONTAINER_PADDING, // Giữ padding cho màn hình và keypad
  },
  // --- Tiêu đề ---
  titleContainer: {
    paddingVertical: 15,
    alignItems: 'flex-start',
    backgroundColor: Colors.accentTeal,
    paddingHorizontal: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textWhite,
  },
  // --- Màn hình hiển thị ---
  displayContainer: {
    padding: 20,
    alignItems: 'flex-end',
    minHeight: 120,
    justifyContent: 'flex-end',
    backgroundColor: Colors.titleBackground, // Dùng màu xám D0D0D0 từ Colors
    borderRadius: 8,
    marginBottom: 10,
  },
  inputExpression: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
    marginBottom: 5,
  },
  displayText: {
    fontSize: 48,
    color: '#333',
    fontWeight: 'bold',
  },
  // --- Hàng Nút Điều Khiển ---
  controlRow: {
    flexDirection: 'row',
    marginBottom: 5, // Giảm khoảng cách dưới để gần keypad hơn
    marginHorizontal: 0, 
    // CHÚ Ý: Bỏ 'space-between' để nút 'Answer' dính sát rìa phải,
    // và 'Delete' dính sát rìa trái (do padding của container), 
    // và có khoảng cách ở giữa do marginRight của nút 'Delete'.
  },
  controlButton: {
    // CHỈNH: Tính toán lại flex để bù trừ khoảng cách:
    // Tổng chiều rộng khả dụng: 100% - CONTROL_BUTTON_GAP
    // Mỗi nút chiếm (100% - CONTROL_BUTTON_GAP) / 2
    // Vì không thể dùng calc() trong React Native Style, ta dùng flex: 1
    // và để React Native Flexbox tự tính toán.
    flex: 1, 
    backgroundColor: Colors.primaryBlue,
    height: 100, // Tăng chiều cao lên 100 theo code bạn cung cấp
    borderRadius: 0, 
    borderWidth: 1,
    borderColor: Colors.keyBorder,
  },
  // --- Keypad (Lưới Nút Bấm) ---
  keypad: {
    flex: 1,
    paddingHorizontal: 0, // Loại bỏ padding keypad để nút sát rìa hơn
    paddingBottom: 5, // Giảm padding bottom
  },
  row: {
    flex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP_SIZE, // Hiện tại GAP_SIZE = 0
  },
  button: {
    width: buttonSize,
    height: buttonSize,
    justifyContent: 'center',
    alignItems: 'center',
    margin: GAP_SIZE / 2, // Hiện tại GAP_SIZE = 0 nên margin = 0
    borderColor: Colors.keyBorder,
    borderRadius: 0,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textWhite,
  },
  numberButton: {
    backgroundColor: '#1d6fb3',
  },
  operatorButton: {
    backgroundColor: Colors.accentTeal,
  },
});

export default App;