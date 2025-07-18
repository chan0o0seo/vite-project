<script setup lang="ts">
import { useAgenticaRpc } from "../api/agentica";
import { onMounted, ref } from "vue";

const { messages, conversate, isConnected, isError, tryConnect } = useAgenticaRpc();

const input = ref("");
const userId = ref("");       // 로그인 폼: 아이디
const password = ref("");     // 로그인 폼: 패스워드
const loginStatus = ref("");  // 로그인 결과 메시지

function send() {
  if (input.value.trim()) conversate(input.value);
  input.value = "";
}

// 로그인 함수
async function login() {
  loginStatus.value = "로그인 시도 중...";
  try {
    const res = await fetch("http://localhost:8080/api/auth/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: userId.value,   // 실제 API 요구사항에 맞춰 key 수정!
        password: password.value
      }),
      credentials: "include" // 쿠키 기반 인증이면 이 옵션 꼭!
    });

    if (!res.ok) {
      loginStatus.value = "로그인 실패: " + res.statusText;
      return;
    }

    const data = await res.json();
    loginStatus.value = "로그인 성공!";
    // 여기서 토큰/세션 쿠키 등 후처리 가능
    // 예: data.accessToken 등
  } catch (err) {
    loginStatus.value = "로그인 중 에러 발생";
    console.error(err);
  }
}

onMounted(() => {
  tryConnect();
});
</script>


<template>
  <form @submit.prevent="login" style="margin-bottom: 1em">
    <input v-model="userId" placeholder="아이디" autocomplete="username" />
    <input v-model="password" placeholder="비밀번호" type="password" autocomplete="current-password" />
    <button type="submit">로그인</button>
    <span style="margin-left:8px;">{{ loginStatus }}</span>
  </form>
  <div>
    <div v-if="!isConnected">연결 중...</div>
    <div v-if="isError">에러!</div>
    <ul>
      <li v-for="msg in messages" :key="msg.id ?? msg.time ?? Math.random()">
        {{ msg.value ?? msg.content ?? msg.text ?? JSON.stringify(msg) }}
      </li>
    </ul>
    <input v-model="input" @keyup.enter="send" placeholder="입력 후 엔터" />
    <button @click="send">보내기</button>
  </div>
</template>
