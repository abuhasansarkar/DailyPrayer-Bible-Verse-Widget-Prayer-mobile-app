import { BookOpen, CheckCircle, ChevronRight, Copy, Heart, Send, Sparkles, X } from "@/components/ui/LucideIcons";
import {
  AI_MODELS,
  AiMessage,
  AiModelId,
  AiReply,
  askAi,
  DEFAULT_MODEL,
  getAiModel,
  isAiConfigured,
  setAiModel,
} from "@/services/ai-assistant";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useResolvedTheme } from "@/hooks/use-theme";

let ClipboardModule: any = null;
try {
  ClipboardModule = require("expo-clipboard");
} catch {
  ClipboardModule = null;
}

type FeatureTab = "prayer" | "scripture" | "chat";

/** How many prior turns to send with a chat message. Keeps prompts bounded. */
const MAX_HISTORY_TURNS = 10;

/** Label shown above any reply that did not come from the model. */
function fallbackNotice(source: AiReply["source"] | null | undefined): string | null {
  switch (source) {
    case "offline":
      return "Offline reflection — the AI companion could not be reached.";
    case "unavailable":
      return "The AI companion is not enabled in this build.";
    case "rate-limited":
      return "Too many requests just now.";
    case "crisis":
      return "Support resources";
    default:
      return null;
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  initialTopic?: string;
};

const PRAYER_TOPICS = [
  {
    label: "Inner Peace",
    icon: "🕊️",
    prompt:
      "a prayer for inner peace, calming anxiety, and resting in God's presence",
  },
  {
    label: "Strength & Courage",
    icon: "🛡️",
    prompt:
      "a prayer for spiritual strength, overcoming challenges, and standing firm",
  },
  {
    label: "Family & Loved Ones",
    icon: "❤️",
    prompt: "a prayer for blessing, unity, protection, and love over my family",
  },
  {
    label: "Healing & Comfort",
    icon: "🌿",
    prompt:
      "a prayer for physical and emotional healing, comfort, and restoration",
  },
  {
    label: "Daily Gratitude",
    icon: "✨",
    prompt:
      "a prayer of thanksgiving for God's unmerited grace and daily blessings",
  },
];

export function AiAssistantModal({ visible, onClose, initialTopic }: Props) {
  const { isDark } = useResolvedTheme();
  const [activeTab, setActiveTab] = useState<FeatureTab>("prayer");
  const [selectedModel, setSelectedModel] = useState<AiModelId>(DEFAULT_MODEL);
  const aiConfigured = isAiConfigured();

  // Form states
  const [customPrompt, setCustomPrompt] = useState("");
  const [response, setResponse] = useState("");
  // Set alongside `response` so a non-model reply is never shown as AI output.
  const [responseSource, setResponseSource] = useState<AiReply["source"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Aborts the in-flight request when the sheet closes or unmounts, so a late
  // reply never lands on a screen the user has already dismissed.
  const abortRef = useRef<AbortController | null>(null);

  const cancelInFlight = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const startRequest = useCallback(() => {
    cancelInFlight();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  }, [cancelInFlight]);

  useEffect(() => cancelInFlight, [cancelInFlight]);

  // Closing the sheet cancels whatever is running.
  useEffect(() => {
    if (!visible) cancelInFlight();
  }, [visible, cancelInFlight]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; text: string; source?: AiReply["source"] }[]
  >([
    {
      role: "assistant",
      text: "Hello! I am your prayer and scripture companion. How can I pray with you or guide your Bible study today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    getAiModel().then(setSelectedModel).catch(console.warn);
  }, []);

  // Adjust state during render rather than in an effect: this is the supported
  // "reset state when a prop changes" pattern, and it avoids the extra render
  // pass a synchronous setState inside useEffect would cause.
  const [appliedTopic, setAppliedTopic] = useState(initialTopic);
  if (initialTopic !== appliedTopic) {
    setAppliedTopic(initialTopic);
    if (initialTopic) {
      setCustomPrompt(initialTopic);
      setActiveTab("prayer");
    }
  }

  const handleModelChange = async (modelId: AiModelId) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedModel(modelId);
      await setAiModel(modelId);
    } catch (err) {
      console.warn(err);
    }
  };

  /** Requests that were cancelled by closing the sheet are not errors. */
  const isAbort = (err: unknown) =>
    err instanceof Error && err.name === "AbortError";

  const handleGeneratePrayer = async (topicPrompt?: string) => {
    const promptToUse =
      topicPrompt ||
      customPrompt ||
      "a uplifting daily prayer for grace and peace";
    const signal = startRequest();
    setLoading(true);
    setResponse("");
    setResponseSource(null);
    setCopied(false);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const reply = await askAi(
        `Write a deeply meaningful Christian prayer about: ${promptToUse}. Include an inspiring Bible verse.`,
        {
          system:
            "You are an inspiring, compassionate Christian prayer assistant. Write formatted prayers with a verse. Quote only public-domain translations such as the King James Version.",
          model: selectedModel,
          signal,
        },
      );
      setResponse(reply.text);
      setResponseSource(reply.source);
    } catch (err) {
      if (isAbort(err)) return;
      console.warn(err);
      setResponse("Unable to generate a prayer right now. Please try again.");
      setResponseSource("offline");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const handleExplainScripture = async () => {
    if (!customPrompt.trim()) return;
    const signal = startRequest();
    setLoading(true);
    setResponse("");
    setResponseSource(null);
    setCopied(false);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const reply = await askAi(
        `Provide a spiritual reflection, historical context, and practical daily application for this verse/topic: "${customPrompt}".`,
        {
          system:
            "You are a warm biblical scholar and devotional guide. Quote only public-domain translations such as the King James Version.",
          model: selectedModel,
          signal,
        },
      );
      setResponse(reply.text);
      setResponseSource(reply.source);
    } catch (err) {
      if (isAbort(err)) return;
      console.warn(err);
      setResponse("Unable to explain scripture at this time.");
      setResponseSource("offline");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    // Prior turns, oldest first. Without this the "chat" answered every
    // message in isolation and could not follow up on anything.
    const history: AiMessage[] = chatMessages
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.text }));

    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    const signal = startRequest();
    setLoading(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const reply = await askAi(userMsg, {
        system:
          "You are a compassionate, encouraging Christian companion helping users grow in faith, prayer, and scripture understanding. Quote only public-domain translations such as the King James Version.",
        model: selectedModel,
        history,
        signal,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: reply.text, source: reply.source },
      ]);
    } catch (err) {
      if (isAbort(err)) return;
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I hit an error processing that message.",
          source: "offline",
        },
      ]);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    try {
      if (ClipboardModule?.setStringAsync) {
        await ClipboardModule.setStringAsync(response);
      } else {
        await Share.share({ message: response });
      }
      setCopied(true);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleShare = async () => {
    if (!response) return;
    try {
      await Share.share({ message: response });
    } catch (err) {
      console.warn(err);
    }
  };

  const bg = isDark ? "#1C1D1B" : "#FFF9EE";
  const cardBg = isDark ? "#292B28" : "#F5EDD8";
  const textColor = isDark ? "#F5F5F0" : "#292B28";
  const subTextColor = isDark ? "#A0A096" : "#77766F";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: bg }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badgeIcon}>
                <Sparkles size={20} color="#292B28" />
              </View>
              <View>
                <Text style={[styles.title, { color: textColor }]}>
                  AI Prayer Features
                </Text>
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  {aiConfigured ? "Prayer, scripture and reflection" : "Offline reflections"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: cardBg }]}
            >
              <X size={18} color={textColor} />
            </Pressable>
          </View>

          {!aiConfigured && (
            <View style={[styles.noticeBar, { backgroundColor: cardBg }]}>
              <Text style={[styles.noticeText, { color: subTextColor }]}>
                The AI companion is not enabled in this build, so answers below are
                written offline reflections rather than generated replies.
              </Text>
            </View>
          )}

          {/* Model Selector Bar */}
          {aiConfigured && (
          <View style={styles.modelBarContainer}>
            <Text style={[styles.modelBarLabel, { color: subTextColor }]}>
              AI Engine:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modelScroll}
            >
              {AI_MODELS.map((m) => {
                const active = selectedModel === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => handleModelChange(m.id)}
                    style={[
                      styles.modelPill,
                      { backgroundColor: active ? "#F2B84B" : cardBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modelPillText,
                        {
                          color: active ? "#292B28" : textColor,
                          fontWeight: active ? "700" : "500",
                        },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          )}

          {/* Feature Tabs */}
          <View style={[styles.tabBar, { backgroundColor: cardBg }]}>
            <Pressable
              onPress={() => {
                setActiveTab("prayer");
                Haptics.selectionAsync();
              }}
              style={[
                styles.tabItem,
                activeTab === "prayer" && styles.tabActive,
              ]}
            >
              <Heart
                size={16}
                color={activeTab === "prayer" ? "#292B28" : subTextColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === "prayer" ? "#292B28" : subTextColor,
                    fontWeight: activeTab === "prayer" ? "700" : "500",
                  },
                ]}
              >
                Prayer
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab("scripture");
                Haptics.selectionAsync();
              }}
              style={[
                styles.tabItem,
                activeTab === "scripture" && styles.tabActive,
              ]}
            >
              <BookOpen
                size={16}
                color={activeTab === "scripture" ? "#292B28" : subTextColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === "scripture" ? "#292B28" : subTextColor,
                    fontWeight: activeTab === "scripture" ? "700" : "500",
                  },
                ]}
              >
                Scripture
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab("chat");
                Haptics.selectionAsync();
              }}
              style={[styles.tabItem, activeTab === "chat" && styles.tabActive]}
            >
              <Sparkles
                size={16}
                color={activeTab === "chat" ? "#292B28" : subTextColor}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === "chat" ? "#292B28" : subTextColor,
                    fontWeight: activeTab === "chat" ? "700" : "500",
                  },
                ]}
              >
                Ask AI
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === "prayer" && (
              <View>
                <Text style={[styles.sectionHeading, { color: textColor }]}>
                  Quick Prayer Topics
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
                >
                  {PRAYER_TOPICS.map((item) => (
                    <Pressable
                      key={item.label}
                      onPress={() => {
                        setCustomPrompt(item.prompt);
                        handleGeneratePrayer(item.prompt);
                      }}
                      style={[styles.topicChip, { backgroundColor: cardBg }]}
                    >
                      <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                      <Text
                        style={[styles.topicChipText, { color: textColor }]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.sectionHeading, { color: textColor }]}>
                  Or Custom Topic / Need
                </Text>
                <View style={[styles.inputBox, { backgroundColor: cardBg }]}>
                  <TextInput
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    placeholder="e.g. Guidance for a new job, peace before sleeping..."
                    placeholderTextColor={subTextColor}
                    multiline
                    style={[styles.textInput, { color: textColor }]}
                  />
                  <Pressable
                    onPress={() => handleGeneratePrayer()}
                    disabled={loading}
                    style={styles.generateBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#292B28" size="small" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#292B28" />
                        <Text style={styles.generateBtnText}>
                          Generate Prayer
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {/* Response Display */}
                {response !== "" && (
                  <View
                    style={[styles.responseCard, { backgroundColor: cardBg }]}
                  >
                    {fallbackNotice(responseSource) && (
                      <Text style={[styles.fallbackNotice, { color: subTextColor }]}>
                        {fallbackNotice(responseSource)}
                      </Text>
                    )}
                    <Text style={[styles.responseText, { color: textColor }]}>
                      {response}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable onPress={handleCopy} style={styles.actionBtn}>
                        {copied ? (
                          <CheckCircle size={14} color="#2E7D32" />
                        ) : (
                          <Copy size={14} color={textColor} />
                        )}
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: copied ? "#2E7D32" : textColor },
                          ]}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </Text>
                      </Pressable>
                      <Pressable onPress={handleShare} style={styles.actionBtn}>
                        <ChevronRight size={14} color={textColor} />
                        <Text
                          style={[styles.actionBtnText, { color: textColor }]}
                        >
                          Share
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === "scripture" && (
              <View>
                <Text style={[styles.sectionHeading, { color: textColor }]}>
                  Verse or Topic to Explain
                </Text>
                <View style={[styles.inputBox, { backgroundColor: cardBg }]}>
                  <TextInput
                    value={customPrompt}
                    onChangeText={setCustomPrompt}
                    placeholder="e.g. John 3:16, Psalm 23, or 'Grace vs Law'..."
                    placeholderTextColor={subTextColor}
                    multiline
                    style={[styles.textInput, { color: textColor }]}
                  />
                  <Pressable
                    onPress={handleExplainScripture}
                    disabled={loading || !customPrompt.trim()}
                    style={styles.generateBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#292B28" size="small" />
                    ) : (
                      <>
                        <BookOpen size={16} color="#292B28" />
                        <Text style={styles.generateBtnText}>
                          Explain Verse
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>

                {response !== "" && (
                  <View
                    style={[styles.responseCard, { backgroundColor: cardBg }]}
                  >
                    {fallbackNotice(responseSource) && (
                      <Text style={[styles.fallbackNotice, { color: subTextColor }]}>
                        {fallbackNotice(responseSource)}
                      </Text>
                    )}
                    <Text style={[styles.responseText, { color: textColor }]}>
                      {response}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable onPress={handleCopy} style={styles.actionBtn}>
                        <Text
                          style={[styles.actionBtnText, { color: textColor }]}
                        >
                          {copied ? "Copied!" : "Copy Text"}
                        </Text>
                      </Pressable>
                      <Pressable onPress={handleShare} style={styles.actionBtn}>
                        <Text
                          style={[styles.actionBtnText, { color: textColor }]}
                        >
                          Share
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeTab === "chat" && (
              <View>
                <View style={styles.chatList}>
                  {chatMessages.map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chatBubble,
                        msg.role === "user"
                          ? styles.userBubble
                          : [styles.aiBubble, { backgroundColor: cardBg }],
                      ]}
                    >
                      {msg.role === "assistant" && fallbackNotice(msg.source) && (
                        <Text style={[styles.fallbackNotice, { color: subTextColor }]}>
                          {fallbackNotice(msg.source)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.chatText,
                          {
                            color: msg.role === "user" ? "#292B28" : textColor,
                          },
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                  ))}
                  {loading && (
                    <View
                      style={[
                        styles.chatBubble,
                        styles.aiBubble,
                        { backgroundColor: cardBg },
                      ]}
                    >
                      <ActivityIndicator size="small" color="#F2B84B" />
                    </View>
                  )}
                </View>

                <View
                  style={[styles.chatInputRow, { backgroundColor: cardBg }]}
                >
                  <TextInput
                    value={chatInput}
                    onChangeText={setChatInput}
                    placeholder="Ask AI anything about faith..."
                    placeholderTextColor={subTextColor}
                    style={[styles.chatTextInput, { color: textColor }]}
                    onSubmitEditing={handleSendChat}
                  />
                  <Pressable
                    onPress={handleSendChat}
                    disabled={loading}
                    style={styles.sendBtn}
                  >
                    <Send size={16} color="#292B28" />
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingTop: 18,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F2B84B",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modelBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  modelBarLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  modelScroll: {
    gap: 6,
  },
  modelPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  modelPillText: {
    fontSize: 12,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#F2B84B",
  },
  tabLabel: {
    fontSize: 13,
  },
  scrollBody: {
    flexGrow: 0,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputBox: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  generateBtn: {
    backgroundColor: "#F2B84B",
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  generateBtnText: {
    color: "#292B28",
    fontWeight: "700",
    fontSize: 14,
  },
  noticeBar: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  fallbackNotice: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  responseCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chatList: {
    gap: 10,
    marginBottom: 12,
  },
  chatBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "85%",
  },
  userBubble: {
    backgroundColor: "#F2B84B",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2B84B",
    alignItems: "center",
    justifyContent: "center",
  },
});
