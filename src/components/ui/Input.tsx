import { View, TextInput, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useResolvedTheme } from '@/hooks/use-theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  editable?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next' | 'search' | 'go';
  rightIcon?: React.ReactNode;
  style?: any;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  hint,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  editable = true,
  autoFocus = false,
  onSubmitEditing,
  returnKeyType = 'done',
  rightIcon,
  style,
}: InputProps) {
  const { isDark } = useResolvedTheme();
  const focused = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? '#D98262'
      : withTiming(focused.value === 1
          ? '#F2B84B'
          : isDark ? 'rgba(245,237,216,0.15)' : 'rgba(41,43,40,0.12)',
        { duration: 150 }),
  }));

  const cardBg = isDark ? '#2A2720' : '#FFFFFF';
  const textColor = isDark ? '#F5EDD8' : '#292B28';
  const placeholderColor = isDark ? '#B8AD97' : '#B8B2AA';
  const labelColor = isDark ? '#B8AD97' : '#77766F';

  return (
    <View style={[{ gap: 6 }, style]}>
      {label && (
        <Text style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 13,
          color: labelColor,
          letterSpacing: 0.1,
        }}>
          {label}
        </Text>
      )}

      <Animated.View style={[{
        backgroundColor: cardBg,
        borderRadius: 14,
        borderWidth: 1.5,
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        paddingHorizontal: 14,
        paddingVertical: multiline ? 12 : 0,
        minHeight: multiline ? numberOfLines * 24 + 24 : 48,
        shadowColor: '#292B28',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }, borderStyle]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          onFocus={() => { focused.value = 1; }}
          onBlur={() => { focused.value = 0; }}
          style={{
            flex: 1,
            fontFamily: 'Inter_400Regular',
            fontSize: 16,
            color: textColor,
            paddingVertical: multiline ? 0 : 12,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {rightIcon && (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        )}
      </Animated.View>

      {error && (
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: '#D98262',
          marginTop: 2,
        }}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: labelColor,
          marginTop: 2,
        }}>
          {hint}
        </Text>
      )}
    </View>
  );
}
