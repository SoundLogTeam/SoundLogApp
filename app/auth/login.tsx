import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { useLoginMutation, useRegisterMutation } from "@/api/authQueries";
import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/IconButton";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { SectionTitle } from "@/components/SectionTitle";
import { SettingsRow } from "@/components/SettingsRow";
import { useAuthStore } from "@/store/authStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { migrateLocalDataToAccount } from "@/utils/localDataMigration";

type AuthMode = "login" | "register";

function getNextRoute(completedOnboarding: boolean) {
  return (completedOnboarding ? "/" : "/onboarding") as never;
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

    if (mode === "register" && !hasAcceptedRequiredTerms) {
      setAuthError(
        "계정을 만들려면 이용약관과 개인정보 처리방침에 동의해주세요.",
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
            })
          : await registerMutation.mutateAsync({
              displayName: trimmedDisplayName || undefined,
              email: normalizedEmail,
              password,
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
      void migrateLocalDataToAccount();
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
          justifyContent: "space-between",
          padding: 24,
          paddingBottom: 42,
          paddingTop: 42,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <PageHeader
            leftContent={
              <IconButton
                label="온보딩으로 돌아가기"
                name="arrow-left"
                onPress={() => router.replace("/onboarding" as never)}
              />
            }
            title="Soundlog"
          />

          <AppText className="mt-9 text-[28px] font-semibold leading-9 text-white">
            계정으로 계속하기
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/58">
            이메일 계정으로 취향, 좋아요, 리캡, 여행 로그를 서버에 동기화할 수
            있어요. Soundlog 이용은 로그인 후 시작할 수 있습니다.
          </AppText>

          <View className="mt-8">
            <SectionTitle title="계정 안내" />
            <SettingsRow
              description="외부 계정 연결 없이 이메일과 비밀번호로 기록을 이어둘 수 있어요."
              icon="lock"
              label="Soundlog 자체 계정"
            />
          </View>
        </View>

        <View className="mt-10 gap-3">
          <View className="flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
            {(["login", "register"] as const).map((item) => {
              const isActive = mode === item;

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  className={`min-h-11 flex-1 items-center justify-center rounded-full ${
                    isActive ? "bg-soundlog-lime" : "bg-transparent"
                  }`}
                  disabled={isPending}
                  onPress={() => handleModePress(item)}
                >
                  <AppText
                    className={`text-sm font-semibold ${
                      isActive ? "text-soundlog-inverse" : "text-white/62"
                    }`}
                  >
                    {item === "login" ? "로그인" : "가입"}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {mode === "register" ? (
            <TextInput
              autoCapitalize="words"
              className="min-h-[54px] rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base text-white"
              editable={!isPending}
              onChangeText={setDisplayName}
              placeholder="이름"
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="next"
              value={displayName}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            className="min-h-[54px] rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base text-white"
            editable={!isPending}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />

          <TextInput
            autoCapitalize="none"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            className="min-h-[54px] rounded-xl border border-white/10 bg-white/[0.06] px-4 text-base text-white"
            editable={!isPending}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void handleSubmit();
            }}
            placeholder="비밀번호"
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="done"
            secureTextEntry
            textContentType={mode === "login" ? "password" : "newPassword"}
            value={password}
          />

          {mode === "register" ? (
            <Pressable
              accessibilityLabel="필수 이용약관과 개인정보 처리방침 동의"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasAcceptedRequiredTerms }}
              className="min-h-12 flex-row items-center gap-3 py-2"
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
                  <Feather color="#050916" name="check" size={15} />
                ) : null}
              </View>
              <AppText className="min-w-0 flex-1 text-xs leading-5 text-white/65">
                이용약관과 개인정보 처리방침에 동의합니다. (필수)
              </AppText>
            </Pressable>
          ) : null}

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
            className="min-h-[56px] items-center justify-center rounded-xl bg-soundlog-lime px-5"
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

          <View className="mt-3 items-center">
            <AppText className="text-center text-[11px] leading-5 text-white/35">
              {mode === "register"
                ? "필수 약관에 동의한 뒤 계정을 만들 수 있어요."
                : "로그인하면 기존 계정의 설정과 기록을 불러옵니다."}
            </AppText>
            <View className="mt-2 flex-row items-center justify-center gap-3">
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
