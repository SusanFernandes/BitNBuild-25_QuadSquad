import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Text } from '~/components/ui/text';
import { useColorScheme } from '~/lib/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { useQueryChat } from '~/lib/api/hooks';
import { useUser } from '~/lib/contexts/UserContext';
import { aiChatData } from '~/lib/utils/fallbackData';

const BORDER_RADIUS = 8;

const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#F9F9F9' : '#F9F9F9',
  surface: isDark ? '#FFFFFF' : '#FFFFFF',
  text: isDark ? '#000000' : '#000000',
  textSecondary: isDark ? '#6B7280' : '#6B7280',
  border: isDark ? '#E5E7EB' : '#E5E7EB',
  primary: isDark ? '#10B981' : '#10B981',
  bubble: isDark ? '#F3F4F6' : '#F3F4F6',
  userBubble: isDark ? '#10B981' : '#10B981',
});

export default function AIScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const { financialProfile } = useUser();
  const colors = getThemeColors(isDarkColorScheme);
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  
  // API hooks
  const queryChatMutation = useQueryChat();

  React.useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: aiChatData.welcomeMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
        },
      },
    ]);
  }, []);

  const onSend = React.useCallback(async (newMessages: IMessage[] = []) => {
    setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    setIsTyping(true);

    try {
      const userMessage = newMessages[0].text;

      // Use backend chat API with user context
      const response = await queryChatMutation.mutateAsync({
        question: userMessage,
        user_context: financialProfile ? {
          annual_income: financialProfile.annual_income,
          age: financialProfile.age,
          city: financialProfile.city,
          current_investments: financialProfile.current_investments,
          cibil_score: financialProfile.cibil_score,
          credit_utilization: financialProfile.credit_utilization,
          home_loan_emi: financialProfile.home_loan_emi,
          outstanding_loan: financialProfile.outstanding_loan,
          risk_profile: financialProfile.risk_profile,
          dependents: financialProfile.dependents,
          nri_status: financialProfile.nri_status,
        } : {
          annual_income: 1200000, // Default context
          age: 30,
          city: 'Mumbai',
        },
      });

      const aiMessage: IMessage = {
        _id: Date.now(),
        text: response.answer,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
        },
      };

      setMessages((previousMessages) => GiftedChat.append(previousMessages, [aiMessage]));
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: IMessage = {
        _id: Date.now(),
        text: "I'm sorry, I'm having trouble connecting to the AI service. Please check your internet connection and try again.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
        },
      };
      setMessages((previousMessages) => GiftedChat.append(previousMessages, [errorMessage]));
    } finally {
      setIsTyping(false);
    }
  }, [queryChatMutation]);

  const renderBubble = (props: any) => {
    const isUser = props.currentMessage.user._id === 1;
    return (
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.userBubble : colors.bubble,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            {
              color: isUser ? '#FFFFFF' : colors.text,
            },
          ]}
        >
          {props.currentMessage.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />

        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
          }}
          isTyping={isTyping}
          renderBubble={renderBubble}
          placeholder="Ask me about taxes, investments, or credit..."
          maxComposerHeight={100}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: BORDER_RADIUS,
    marginVertical: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 20,
  },
});