import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import { useAppTheme } from '@/utils/useAppTheme'

interface ToastProps {
  visible: boolean
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onHide: () => void
}

const { width } = Dimensions.get('window')

export const Toast: React.FC<ToastProps> = ({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onHide 
}) => {
  const { themed, theme } = useAppTheme()
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Auto hide
      const timer = setTimeout(() => {
        hideToast()
      }, duration)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [visible])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide()
    })
  }

  if (!visible) return null

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4caf50',
          borderLeftColor: '#2e7d32',
        }
      case 'error':
        return {
          backgroundColor: '#f44336',
          borderLeftColor: '#c62828',
        }
      case 'info':
      default:
        return {
          backgroundColor: '#2196f3',
          borderLeftColor: '#1565c0',
        }
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          themed(({ colors }) => ({
            backgroundColor: colors.palette.neutral100,
            shadowColor: colors.text,
          })),
          getToastStyle(),
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>
        <Text style={[styles.message, { color: '#fff' }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderLeftWidth: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
})
