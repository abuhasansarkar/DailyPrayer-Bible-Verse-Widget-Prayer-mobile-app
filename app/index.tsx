import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  formatBibleText,
  getBibleVerse,
} from "../src/services/bibleApi";
import type { BibleVerse } from "../src/types/bible";

export default function HomeScreen() {
  const [verse, setVerse] = useState<BibleVerse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadVerse() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await getBibleVerse({
        version: "en-kjv",
        book: "john",
        chapter: 3,
        verse: 16,
      });

      setVerse(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load the Bible verse.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadVerse();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>VERSE OF THE DAY</Text>
        <Text style={styles.reference}>John 3:16</Text>

        <View style={styles.card}>
          {isLoading ? (
            <ActivityIndicator size="large" />
          ) : errorMessage ? (
            <>
              <Text style={styles.errorText}>{errorMessage}</Text>

              <Pressable style={styles.button} onPress={loadVerse}>
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            </>
          ) : verse ? (
            <Text style={styles.verseText}>
              “{formatBibleText(verse.text)}”
            </Text>
          ) : null}
        </View>

        <Text style={styles.translation}>King James Version</Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={loadVerse}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Reload verse</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F4EC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  eyebrow: {
    color: "#7A6A54",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  reference: {
    marginTop: 10,
    color: "#29231D",
    fontSize: 34,
    fontWeight: "700",
  },
  card: {
    minHeight: 260,
    marginTop: 30,
    padding: 28,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  verseText: {
    color: "#332C25",
    fontSize: 25,
    lineHeight: 38,
    fontWeight: "500",
  },
  translation: {
    marginTop: 16,
    color: "#7A6A54",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#A33A3A",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    minHeight: 54,
    marginTop: 28,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "#594B3D",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});


