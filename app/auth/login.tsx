import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { useLoginMutation, useRegisterMutation } from "@/api/authQueries";
import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/IconButton";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/store/authStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { SOUNDLOG_TERMS_VERSION } from "@/constants/legal";

type AuthMode = "login" | "register";

function getNextRoute(completedOnboarding: boolean) {
  return (completedOnboarding ? "/" : "/onboarding?mode=setup") as never;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "로그인에 실패했어요. 잠시 후 다시 시도해주세요.";
}

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasAcceptedRequiredTerms, setHasAcceptedRequiredTerms] =
    useState(false);
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const isPending = loginMutation.isPending || registerMutation.isPending;
  const { clearAuthError, errorMessage, finishLogin, setAuthError, setStatus } =
    useAuthStore();
  const { profile, updateProfile } = useUserProfileStore();

  const handleModePress = (nextMode: AuthMode) => {
    setMode(nextMode);
    setHasAcceptedRequiredTerms(false);
    clearAuthError();
  };

  const handleSubmit = async () => {
    if (isPending) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedDisplayName = displayName.trim();

    if (!normalizedEmail.includes("@")) {
      setAuthError("이메일을 확인해주세요.");
      return;
    }

    if (password.length < 8) {
      setAuthError("비밀번호는 8자 이상이어야 해요.");
      return;
    }

    if (!hasAcceptedRequiredTerms) {
      setAuthError(
        mode === "register"
          ? "계정을 만들려면 이용약관과 개인정보 처리방침에 동의해주세요."
          : "로그인하려면 최신 이용약관과 개인정보 처리방침에 동의해주세요.",
      );
      return;
    }

    setStatus("checking");
    clearAuthError();

    try {
      const session =
        mode === "login"
          ? await loginMutation.mutateAsync({
              email: normalizedEmail,
              password,
              termsAccepted: true,
              termsVersion: SOUNDLOG_TERMS_VERSION,
            })
          : await registerMutation.mutateAsync({
              displayName: trimmedDisplayName || undefined,
              email: normalizedEmail,
              password,
              termsAccepted: true,
              termsVersion: SOUNDLOG_TERMS_VERSION,
            });

      const didCompleteOnboarding =
        profile.completedOnboarding ||
        Boolean(session.profile?.completedOnboarding);

      if (
        !profile.completedOnboarding &&
        session.profile?.completedOnboarding
      ) {
        updateProfile(session.profile);
      }

      finishLogin(session);
      router.replace(getNextRoute(didCompleteOnboarding));
    } catch (error) {
      setStatus("unauthenticated");
      setAuthError(getErrorMessage(error));
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingBottom: 42,
          paddingTop: 42,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          leftContent={
            <IconButton
              label="온보딩으로 돌아가기"
              name="arrow-left"
              onPress={() => router.replace("/onboarding" as never)}
            />
          }
          title={mode === "login" ? "로그인" : "회원가입"}
        />

        <View className="mt-10">
          <AppText className="text-[28px] font-semibold leading-9 text-white">
            {mode === "login"
              ? "다시 만나서 반가워요"
              : "Soundlog를 시작해볼까요?"}
          </AppText>
          <AppText className="mt-3 text-sm leading-6 text-white/65">
            {mode === "login"
              ? "이메일과 비밀번호를 입력해주세요."
              : "기록을 안전하게 보관할 계정을 만들어주세요."}
          </AppText>
        </View>

        <View className="mt-10 gap-4">
          {mode === "register" ? (
            <View>
              <AppText className="mb-2 text-sm font-semibold text-white">
                이름
              </AppText>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                className="min-h-[56px] rounded-xl border border-white/16 bg-white/[0.08] px-4 text-base text-white"
                editable={!isPending}
                onChangeText={setDisplayName}
                placeholder="이름을 입력해주세요"
                placeholderTextColor="rgba(255,255,255,0.38)"
                returnKeyType="next"
                textContentType="name"
                value={displayName}
              />
            </View>
          ) : null}

          <View>
            <AppText className="mb-2 text-sm font-semibold text-white">
              이메일
            </AppText>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              className="min-h-[56px] rounded-xl border border-white/16 bg-white/[0.08] px-4 text-base text-white"
              editable={!isPending}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="rgba(255,255,255,0.38)"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
          </View>

          <View>
            <AppText className="mb-2 text-sm font-semibold text-white">
              비밀번호
            </AppText>
            <View className="min-h-[56px] flex-row items-center rounded-xl border border-white/16 bg-white/[0.08]">
              <TextInput
                autoCapitalize="none"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="min-h-[56px] min-w-0 flex-1 px-4 text-base text-white"
                editable={!isPending}
                onChangeText={setPassword}
                onSubmitEditing={() => {
                  void handleSubmit();
                }}
                placeholder="8자 이상 입력해주세요"
                placeholderTextColor="rgba(255,255,255,0.38)"
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                textContentType={mode === "login" ? "password" : "newPassword"}
                value={password}
              />
              <Pressable
                accessibilityLabel={
                  isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"
                }
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center"
                onPress={() => setIsPasswordVisible((visible) => !visible)}
              >
                <Feather
                  color="rgba(255,255,255,0.62)"
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={18}
                />
              </Pressable>
            </View>
            {mode === "register" ? (
              <AppText className="mt-2 text-xs text-white/55">
                비밀번호는 8자 이상이어야 합니다.
              </AppText>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="필수 이용약관과 개인정보 처리방침 동의"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: hasAcceptedRequiredTerms }}
            className="min-h-12 flex-row items-center gap-3 py-1"
            disabled={isPending}
            onPress={() => {
              setHasAcceptedRequiredTerms((accepted) => !accepted);
              clearAuthError();
            }}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-md border ${
                hasAcceptedRequiredTerms
                  ? "border-soundlog-lime bg-soundlog-lime"
                  : "border-white/25 bg-transparent"
              }`}
            >
              {hasAcceptedRequiredTerms ? (
                <Feather color="#4A1D96" name="check" size={15} />
              ) : null}
            </View>
            <AppText className="min-w-0 flex-1 text-xs leading-5 text-white/65">
              최신 이용약관과 개인정보 처리방침에 동의합니다. (필수)
            </AppText>
          </Pressable>

          {errorMessage ? (
            <View className="flex-row items-start gap-3 py-2">
              <Feather color="#FF8F8F" name="alert-circle" size={16} />
              <AppText className="min-w-0 flex-1 text-xs leading-5 text-[#FFB3B3]">
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="mt-2 min-h-[56px] items-center justify-center rounded-xl border border-soundlog-lime/45 bg-soundlog-action px-5"
            disabled={isPending}
            onPress={() => {
              void handleSubmit();
            }}
          >
            <AppText className="text-sm font-semibold text-soundlog-inverse">
              {isPending
                ? "처리 중..."
                : mode === "login"
                  ? "로그인"
                  : "계정 만들기"}
            </AppText>
          </Pressable>

          <View className="mt-2 flex-row items-center justify-center gap-1">
            <AppText className="text-sm text-white/62">
              {mode === "login"
                ? "계정이 없으신가요?"
                : "이미 계정이 있으신가요?"}
            </AppText>
            <Pressable
              accessibilityRole="button"
              className="min-h-11 justify-center px-2"
              disabled={isPending}
              onPress={() =>
                handleModePress(mode === "login" ? "register" : "login")
              }
            >
              <AppText className="text-sm font-semibold text-soundlog-lime">
                {mode === "login" ? "회원가입" : "로그인"}
              </AppText>
            </Pressable>
          </View>

          <View className="mt-1 items-center">
            <View className="flex-row items-center justify-center gap-3">
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/legal/terms" as never)}
              >
                <AppText className="text-[11px] font-semibold text-white/62">
                  이용약관
                </AppText>
              </Pressable>
              <AppText className="text-[11px] text-white/20">|</AppText>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push("/legal/privacy" as never)}
              >
                <AppText className="text-[11px] font-semibold text-white/62">
                  개인정보 처리방침
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
