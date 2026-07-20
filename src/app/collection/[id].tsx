import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { getDb, parseJson } from '@/db/client';

interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  item_ids: string;
  item_type: string;
}

interface ItemRow {
  id: string;
  reference: string;
  text: string;
}

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const [collection, setCollection] = useState<CollectionRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  useEffect(() => {
    async function load() {
      if (!id) return;
      const db = getDb();
      const col = await db.getFirstAsync<CollectionRow>(
        'SELECT * FROM user_collections WHERE id = ?',
        [id]
      );
      if (col) {
        setCollection(col);
        const itemIds = parseJson<string[]>(col.item_ids, []);
        if (itemIds.length > 0) {
          const placeholders = itemIds.map(() => '?').join(',');
          const rows = await db.getAllAsync<ItemRow>(
            `SELECT id, reference, text FROM verses WHERE id IN (${placeholders})`,
            itemIds
          );
          setItems(rows);
        }
      }
    }
    load();
  }, [id]);

  if (!collection) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: textSecondary }}>Collection not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#2A2720' : '#F1E6D3', alignItems: 'center', justifyContent: 'center' }}>
          <Text>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>{collection.emoji}</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, letterSpacing: -0.5 }}>
            {collection.name}
          </Text>
          {collection.description && (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, textAlign: 'center', marginTop: 6 }}>
              {collection.description}
            </Text>
          )}
        </View>

        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18, color: textPrimary, marginBottom: 14 }}>
          {items.length} Items
        </Text>

        <View style={{ gap: 12 }}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/verse/${item.id}`)}
              style={{ backgroundColor: cardBg, borderRadius: 20, padding: 18, shadowColor: '#292B28', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
            >
              <Text style={{ fontFamily: 'Lora_400Regular_Italic', fontSize: 16, lineHeight: 26, color: textPrimary, marginBottom: 10 }}>
                "{item.text}"
              </Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textSecondary }}>
                {item.reference}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
