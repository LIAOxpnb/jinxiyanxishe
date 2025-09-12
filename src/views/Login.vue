<template>
  <div class="login-page">
    <div class="login-container">
      <div class="header">
        <img src="../assets/img/u71.png" alt="logo" class="logo" />
        <span class="title">金析社</span>
      </div>

  <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input type="text" id="phoneNumber" v-model="form.username" placeholder="手机号" />
        </div>
        <div class="form-group password-wrapper">
          <input :type="passwordFieldType" id="password" v-model="form.password" placeholder="请输入密码" />
          <span class="toggle-password" @click="togglePasswordVisibility">
            <svg v-if="isPasswordVisible" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
          </span>
        </div>
  <!-- 使用 sessionStorage 存储 token，登录后在会话结束时清除 -->
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="footer-links">
        <a href="#" @click.prevent="forgetPasswordDialogVisible = true">忘记密码</a>
        <a href="#" @click.prevent="openAccountDialogVisible = true">开通账号</a>
      </div>
    </div>

    <el-dialog
      v-model="forgetPasswordDialogVisible"
      title="忘记密码"
      width="30%"
      align-center
    >
      <div class="dialog-content">
        请联系 XXXXXX为您重置密码
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="info" @click="forgetPasswordDialogVisible = false" class="close-button">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="openAccountDialogVisible"
      title="开通账号"
      width="30%"
      align-center
    >
      <div class="dialog-content">
        开通账号请联系 XXXXXX
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="info" @click="openAccountDialogVisible = false" class="close-button">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElDialog, ElButton } from 'element-plus'; // 引入 ElDialog 和 ElButton

import { login } from '@/api/user.js';

const router = useRouter();
const route = useRoute();

const form = reactive({
  username: '',
  password: '',
});

const isLoading = ref(false);

const isPasswordVisible = ref(false);
const passwordFieldType = computed(() => (isPasswordVisible.value ? 'text' : 'password'));
const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value;
};

// 登录凭证统一使用 sessionStorage 存储（浏览器关闭后失效）

// --- 新增：对话框的显示状态 ---
const forgetPasswordDialogVisible = ref(false);
const openAccountDialogVisible = ref(false);
// --- 新增结束 ---

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入手机号和密码');
    return;
  }

  isLoading.value = true;
  try {
    const responseData = await login(form);

    console.log('登录响应数据:', responseData);
    
    if (responseData && responseData.data && responseData.data.tokenValue) {
      const { tokenValue, tokenName } = responseData.data;
      try {
        sessionStorage.setItem('token', tokenValue);
        sessionStorage.setItem('tokenName', tokenName);
      } catch (e) {
        // ignore storage errors
      }
      ElMessage.success('登錄成功！');
      
      // 获取重定向路径，如果没有则跳转到首页
      const redirectPath = route.query.redirect || '/home';
      router.push(redirectPath);
    } else if (responseData && responseData.tokenValue) {
      try {
        sessionStorage.setItem('token', responseData.tokenValue);
        sessionStorage.setItem('tokenName', responseData.tokenName);
      } catch (e) {
        // ignore storage errors
      }
      ElMessage.success('登錄成功！');
      
      // 获取重定向路径，如果没有则跳转到首页
      const redirectPath = route.query.redirect || '/home';
      router.push(redirectPath);
    } else {
       console.error('响应数据结构异常:', responseData);
       const backendMsg = responseData?.msg || responseData?.message;
       if (backendMsg) {
         throw new Error(backendMsg);
       }
       throw new Error('登錄成功，但未獲取到Token');
    }

  } catch (error) {
    console.error('登錄失敗:', error);
    const errorMsg = error?.message || error?.data?.message || '登錄失敗，請稍後再試';
    ElMessage.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped src="../assets/style/Login.style.css"></style>

