import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { t } from '../i18n';
import { generateRecommendations, AdvisorRecommendation } from '../services/ai/waterAdvisor';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "👋 Hello! I'm your Water Conservation Assistant. I can help you with:\n\n💧 Water-saving tips and advice\n📊 Analysis of your usage patterns\n🌍 Environmental water information\n💡 Personalized recommendations\n\nHow can I help you save water today?",
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    setInitializing(false);
  };

  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm here to help you conserve water. What would you like to know?";
    }
    
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('help')) {
      const tips = [
        "💡 Fix leaking faucets immediately - they can waste up to 20 liters per day!",
        "🚿 Reduce shower time by 2 minutes to save approximately 20 liters per shower.",
        "🦷 Turn off the tap while brushing your teeth - saves about 6 liters each time.",
        "🧺 Only run washing machines and dishwashers with full loads.",
        "🌱 Water your garden early morning or late evening to minimize evaporation.",
        "🚗 Use a bucket instead of a hose when washing your car - saves up to 300 liters!",
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    if (lowerMessage.includes('usage') || lowerMessage.includes('consumption') || lowerMessage.includes('how much')) {
      try {
        const recs = await generateRecommendations();
        if (recs.length > 0) {
          return `Based on your data:\n\n${recs[0].message}\n\n${recs[0].actionable}`;
        }
      } catch (error) {
        // Fall through to default
      }
      return "To see your usage analysis, make sure you're tracking your water consumption regularly in the Usage screen.";
    }
    
    if (lowerMessage.includes('bill') || lowerMessage.includes('cost') || lowerMessage.includes('money')) {
      return "💰 To reduce your water bill:\n\n1. Fix all leaks immediately\n2. Install water-efficient fixtures\n3. Use appliances efficiently (full loads only)\n4. Monitor your daily usage\n5. Set a daily water usage goal\n\nTrack your bills in the Bills section to see your progress!";
    }
    
    if (lowerMessage.includes('shower') || lowerMessage.includes('bath')) {
      return "🚿 Shower Tips:\n\n• Limit showers to 5 minutes (saves ~50L per shower)\n• Install a low-flow showerhead (reduces flow by 40%)\n• Turn off water while soaping up\n• Consider a shower timer\n\nA 5-minute shower uses ~50L, while a bath uses ~150L!";
    }
    
    if (lowerMessage.includes('garden') || lowerMessage.includes('plant') || lowerMessage.includes('lawn')) {
      return "🌱 Garden Water-Saving Tips:\n\n• Water in early morning or late evening\n• Use mulch to retain moisture\n• Collect rainwater for irrigation\n• Choose native, drought-resistant plants\n• Use drip irrigation instead of sprinklers\n• Water deeply but less frequently";
    }
    
    if (lowerMessage.includes('leak') || lowerMessage.includes('drip')) {
      return "🔧 Detecting & Fixing Leaks:\n\n1. Check your water meter before and after 2 hours of no water use\n2. Look for wet spots on walls, ceilings, floors\n3. Listen for running water when everything is off\n4. A dripping faucet (1 drop/sec) wastes 20L per day\n5. Call a plumber for persistent leaks\n\nFix leaks ASAP - they're your biggest water wasters!";
    }
    
    if (lowerMessage.includes('drought') || lowerMessage.includes('climate') || lowerMessage.includes('weather')) {
      return "🌍 Water & Climate:\n\nCheck the Weather section for:\n• Current precipitation levels\n• Drought risk indicators\n• Weather-based water-saving recommendations\n\nDuring drought conditions:\n• Limit outdoor water use\n• Prioritize essential indoor use\n• Follow local water restrictions";
    }
    
    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      return "🎯 Setting Water Goals:\n\n• Average person uses 100-150L per day\n• Efficient usage: 80-100L per day\n• Set your goal in Settings\n• Track progress in Usage screen\n• Adjust habits based on your patterns\n\nStart with a realistic goal and gradually reduce!";
    }
    
    return "I'm focused on water conservation! I can help with:\n\n💧 Water-saving tips\n🚿 Shower & bathing advice\n🌱 Garden watering\n🔧 Leak detection\n💰 Reducing bills\n📊 Usage analysis\n\nWhat specific water-related topic would you like to discuss?";
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage.text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 500);
  };

  const renderMessage = (message: Message) => {
    const isBot = message.sender === 'bot';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        {isBot && <Text style={styles.botAvatar}>🤖</Text>}
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          <Text style={[styles.messageText, isBot ? styles.botText : styles.userText]}>
            {message.text}
          </Text>
          <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isBot && <Text style={styles.userAvatar}>👤</Text>}
      </View>
    );
  };

  if (initializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
        <Text style={styles.loadingText}>Initializing AI Assistant...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.title}>💬 AI Water Advisor</Text>
        <Text style={styles.subtitle}>Your water conservation assistant</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        {loading && (
          <View style={[styles.messageContainer, styles.botMessageContainer]}>
            <Text style={styles.botAvatar}>🤖</Text>
            <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
              <Text style={styles.typingText}>Typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about water conservation..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#9C27B0',
    padding: 20,
    paddingTop: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#7B1FA2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#E1BEE7',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botAvatar: {
    fontSize: 32,
    marginRight: 8,
    marginBottom: 4,
  },
  userAvatar: {
    fontSize: 32,
    marginLeft: 8,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#9C27B0',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  botTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: '#E1BEE7',
  },
  loadingBubble: {
    paddingVertical: 16,
  },
  typingText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

