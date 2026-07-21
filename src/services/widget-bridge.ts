import { NativeModules, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface WidgetPayload {
  verseText: string;
  verseReference: string;
  translation?: string;
  dateString?: string;
  themeId?: string;
  streakCount?: number;
  updatedAt?: string;
}

const WIDGET_DATA_KEY = 'dailyprayer_widget_payload';

/**
 * Service to sync current Verse of the Day and App State to Native OS Home-Screen Widgets.
 */
export class WidgetBridgeService {
  /**
   * Update the widget data payload in local storage & native SharedPreferences
   */
  static async updateWidgetData(payload: WidgetPayload): Promise<boolean> {
    try {
      const dataJson = JSON.stringify({
        ...payload,
        updatedAt: payload.updatedAt || new Date().toISOString(),
      });

      // 1. Store in SecureStore for JS access
      await SecureStore.setItemAsync(WIDGET_DATA_KEY, dataJson);

      // 2. Native Bridge call if NativeModule is available
      if (Platform.OS === 'android' && NativeModules.DailyPrayerWidgetModule) {
        await NativeModules.DailyPrayerWidgetModule.updateWidget(dataJson);
      }

      return true;
    } catch (error) {
      console.warn('[WidgetBridge] Failed to update widget data:', error);
      return false;
    }
  }

  /**
   * Retrieve the current widget payload
   */
  static async getWidgetData(): Promise<WidgetPayload | null> {
    try {
      const data = await SecureStore.getItemAsync(WIDGET_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('[WidgetBridge] Failed to read widget data:', error);
      return null;
    }
  }
}
