<template>
  <div class="login-page">
    <div class="login-container">
      <div class="header">
        <img :src="logoUrl || defaultLogo" alt="logo" class="logo" />
        <span class="title">{{ sysName || '金析研习社' }}</span>
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

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div style="margin-bottom: 20px; color: #666; font-size: 14px;">
        首次登录需要修改密码，请设置新密码：
      </div>
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码（6-32位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleResetPassword" :loading="resetPasswordLoading">
            确认修改
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElDialog, ElButton } from 'element-plus'; // 引入 ElDialog 和 ElButton

import { login } from '@/api/common/user.js';
import { getUserInfo, updateMyPassword } from '@/api/common/user.js';
import { getGlobalConfig } from '@/utils/globalConfig';

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

// 平台名称/图标（动态）
const sysName = ref('');
const logoUrl = ref('');
const defaultLogo = new URL('../assets/img/u71.png', import.meta.url).href;

const loadPlatformConfig = async () => {
  try {
    const config = await getGlobalConfig();
    if (config) {
      sysName.value = config.sysName || '';
      logoUrl.value = config.iconUrl || '';
    }
  } catch (e) {
    // 未登录状态下静默处理，不显示错误
    console.log('获取平台配置失败（未登录）');
  }
};

// 登录凭证统一使用 sessionStorage 存储（浏览器关闭后失效）

// --- 新增：对话框的显示状态 ---
const forgetPasswordDialogVisible = ref(false);
const openAccountDialogVisible = ref(false);
const resetPasswordDialogVisible = ref(false);
// --- 新增结束 ---

// 重置密码相关状态
const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
});
const resetPasswordLoading = ref(false);
const resetPasswordFormRef = ref();

// 重置密码表单验证规则
const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度应在6-32位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 获取用户权限信息
const fetchUserPermissions = async () => {
  try {
    const userInfoResponse = await getUserInfo();
    console.log('用户信息响应:', userInfoResponse);
    
    if (userInfoResponse && userInfoResponse.code === 200 && userInfoResponse.data) {
      const { permissions } = userInfoResponse.data;
      
      // 将权限信息存储到 sessionStorage
      if (permissions && Array.isArray(permissions)) {
        sessionStorage.setItem('userPermissions', JSON.stringify(permissions));
        console.log('用户权限:', permissions);
      } else {
        sessionStorage.setItem('userPermissions', JSON.stringify([]));
      }
      
      // 返回用户信息，用于检查是否需要修改密码
      return userInfoResponse.data;
    }
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    // 即使获取用户信息失败，也不影响登录流程
    sessionStorage.setItem('userPermissions', JSON.stringify([]));
    return null;
  }
};

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入手机号和密码');
    return;
  }

  isLoading.value = true;
  try {
    const responseData = await login(form);

    console.log('登录响应数据:', responseData);
    
    let userInfo = null; // 在函数顶部声明 userInfo 变量
    
    if (responseData && responseData.data && responseData.data.tokenValue) {
      const { tokenValue, tokenName } = responseData.data;
      try {
        sessionStorage.setItem('token', tokenValue);
        sessionStorage.setItem('tokenName', tokenName);
        
        // 登录成功后获取用户信息和权限
        userInfo = await fetchUserPermissions();
        
      } catch (e) {
        // ignore storage errors
      }

      // 检查是否需要修改密码
      if (userInfo && userInfo.needChangePassword === 1) {
        ElMessage.warning('首次登录需要修改密码');
        resetPasswordDialogVisible.value = true;
        return; // 不跳转页面，等待用户修改密码
      }

      ElMessage.success('登录成功！');
      
      // 获取重定向路径，如果没有则跳转到首页
      const redirectPath = route.query.redirect || '/home';
      router.push(redirectPath);
    } else if (responseData && responseData.tokenValue) {
      try {
        sessionStorage.setItem('token', responseData.tokenValue);
        sessionStorage.setItem('tokenName', responseData.tokenName);
        
        // 登录成功后获取用户信息和权限
        userInfo = await fetchUserPermissions();
        
      } catch (e) {
        // ignore storage errors
      }

      // 检查是否需要修改密码
      if (userInfo && userInfo.needChangePassword === 1) {
        ElMessage.warning('首次登录需要修改密码');
        resetPasswordDialogVisible.value = true;
        return; // 不跳转页面，等待用户修改密码
      }

      ElMessage.success('登录成功！');
      
      // 获取重定向路径，如果没有则跳转到首页
      const redirectPath = route.query.redirect || '/home';
      router.push(redirectPath);
    } else {
       console.error('响应数据结构异常:', responseData);
       const backendMsg = responseData?.msg || responseData?.message;
       if (backendMsg) {
         throw new Error(backendMsg);
       }
       throw new Error('登录成功，但未获取到Token');
    }

  } catch (error) {
    console.error('登录失败:', error);
    const errorMsg = error?.message || error?.data?.message || '登录失败，请稍后再试';
    ElMessage.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
};

// 处理重置密码
const handleResetPassword = async () => {
  try {
    await resetPasswordFormRef.value.validate();
    
    resetPasswordLoading.value = true;
    
    // 调用修改个人密码接口
    const response = await updateMyPassword({
      password: resetPasswordForm.newPassword
    });
      
    if (response.code === 200) {
      ElMessage.success('密码修改成功！');
      
      // 重置表单
      resetPasswordForm.newPassword = '';
      resetPasswordForm.confirmPassword = '';
      resetPasswordDialogVisible.value = false;
      
      // 跳转到首页
      ElMessage.success('登录成功！');
      const redirectPath = route.query.redirect || '/home';
      router.push(redirectPath);
    } else {
      ElMessage.error(response.msg || '密码修改失败');
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error('密码修改失败');
      console.error('重置密码错误:', error);
    }
  } finally {
    resetPasswordLoading.value = false;
  }
};

onMounted(() => {
  loadPlatformConfig();
});
</script>

<style scoped src="../assets/style/Login.style.css"></style>

