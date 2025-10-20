<template>
  <div class="private-letter-layout" v-loading="loading">
    <div class="address-book-panel">
      <div 
        v-for="contact in addressBook" 
        :key="contact.conversationId" 
        class="user-item"
        :class="{ active: activeContact && activeContact.conversationId === contact.conversationId }"
        @click="selectContact(contact)"
      >
        <el-avatar :size="40" :src="contact.avatar" />
        <div class="user-info">
          <div class="user-name">{{ contact.name }}</div>
          <div class="last-message">{{ contact.lastMessage }}</div>
        </div>
      </div>
      <el-empty v-if="!loading && addressBook.length === 0" description="暂无联系人" :image-size="80"></el-empty>
    </div>

    <div class="chat-panel">
      <template v-if="activeContact">
        <div class="chat-header">{{ activeContact.name }}</div>
        <div class="chat-history" ref="chatHistoryRef">
          <div 
            v-for="msg in chatHistory" 
            :key="msg.id" 
            class="message-wrapper"
            :class="{ self: msg.sender === currentUser.id }"
          >
            <el-avatar class="message-avatar" :src="msg.sender === currentUser.id ? currentUser.avatar : activeContact.avatar" />
            <div class="message-content">
              <div class="message-bubble">{{ msg.content }}</div>
              <div class="message-time">{{ msg.createTime }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="newMessage"
            type="textarea"
            :rows="4"
            placeholder="输入消息..."
            @keyup.enter="handleSendMessage"
          />
          <el-button type="primary" @click="handleSendMessage" :disabled="!newMessage.trim()">发送</el-button>
        </div>
      </template>
      <el-empty v-else description="选择一个联系人开始聊天" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getAddressBook, getChatRecord, sendMessage } from '@/api/message.js';
// 【核心修正】引入 getUserInfo API
import { getUserInfo } from '@/api/common/user.js'; //

const router = useRouter();
const loading = ref(true);
const addressBook = ref([]);
const chatHistory = ref([]);
const activeContact = ref(null);
const newMessage = ref('');
const chatHistoryRef = ref(null);

// 【核心修正】移除硬编码，改为动态获取
const currentUser = ref({ id: null, avatar: '' });

/**
 * @description: 获取当前登录用户信息
 */
const fetchCurrentUser = async () => {
  try {
    const res = await getUserInfo(); //
    if (res.code === 200 && res.data) {
      currentUser.value.id = res.data.id;
      currentUser.value.avatar = res.data.avatar; // 假设返回数据中有 avatar
      return true; // 表示获取成功
    } else {
      throw new Error(res.msg || '获取用户信息失败');
    }
  } catch (error) {
    ElMessage.error('无法获取当前用户信息，请重新登录。');
    router.push('/login');
    return false; // 表示获取失败
  }
};


const fetchAddressBook = async () => {
  if (!currentUser.value.id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const res = await getAddressBook();
    if (res.code === 200 && res.data) {
      const currentUserId = currentUser.value.id;
      addressBook.value = (res.data || []).map(convo => {
        const isCurrentUserSender = convo.sender === currentUserId;
        const oppositeUser = isCurrentUserSender ? convo.receiverUser : convo.senderUser;
        
        if (!oppositeUser) return null;

        return {
          conversationId: convo.id,
          lastMessage: convo.lastMessage,
          id: oppositeUser.id,
          name: oppositeUser.name,
          avatar: oppositeUser.avatar,
        };
      }).filter(Boolean);
      
    } else {
      ElMessage.error(res.msg || '获取通讯录失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，获取通讯录失败');
  } finally {
    loading.value = false;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    }
  });
};

const selectContact = async (contact) => {
  if (activeContact.value?.conversationId === contact.conversationId) return;
  activeContact.value = contact;
  chatHistory.value = [];
  try {
    const params = { oppositeUserId: contact.id, page: 1, size: 20 };
    const res = await getChatRecord(params);
    if (res.code === 200 && res.data) {
      chatHistory.value = (res.data.records || []).reverse();
      scrollToBottom();
    } else {
      ElMessage.error(res.msg || '获取聊天记录失败');
    }
  } catch (error) {
    ElMessage.error('网络错误，获取聊天记录失败');
  }
};

const handleSendMessage = async () => {
  if (!newMessage.value.trim() || !activeContact.value) return;

  const content = newMessage.value;
  const receiverId = activeContact.value.id;
  
  const optimisticMessage = {
    id: Date.now(),
    sender: currentUser.value.id,
    content: content,
    createTime: new Date().toLocaleString()
  };
  chatHistory.value.push(optimisticMessage);
  scrollToBottom();
  newMessage.value = '';

  try {
    const res = await sendMessage({ receiver: receiverId, content });
    if (res.code !== 200) {
      ElMessage.error(res.msg || '发送失败');
      chatHistory.value.pop();
    }
  } catch (error) {
    ElMessage.error(error.msg || '网络错误，发送失败');
    chatHistory.value.pop();
  }
};

// 【核心修正】调整 onMounted 逻辑，确保先获取用户信息
onMounted(async () => {
  loading.value = true;
  const gotUser = await fetchCurrentUser();
  // 如果成功获取到用户信息，再继续加载通讯录
  if (gotUser) {
    await fetchAddressBook();
  }
  loading.value = false; // 最终确保 loading 状态被关闭
});
</script>

<style scoped>
/* 样式无需修改 */
.private-letter-layout {
  display: flex;
  height: 100%;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}
.address-book-panel {
  width: 280px;
  border-right: 1px solid #f0f2f5;
  padding: 10px 0;
  overflow-y: auto;
  flex-shrink: 0;
}
.user-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.user-item:hover {
  background-color: #f5f7fa;
}
.user-item.active {
  background-color: #ecf5ff;
}
.user-info {
  margin-left: 12px;
  overflow: hidden;
}
.user-name {
  font-weight: 500;
  color: #303133;
}
.last-message {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.chat-header {
  padding: 15px 20px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f2f5;
}
.chat-history {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
}
.message-wrapper {
  display: flex;
  margin-bottom: 20px;
}
.message-avatar {
  flex-shrink: 0;
}
.message-content {
  margin: 0 10px;
  display: flex;
  flex-direction: column;
}
.message-bubble {
  padding: 10px 15px;
  border-radius: 8px;
  background-color: #f5f7fa;
  font-size: 14px;
  line-height: 1.5;
  max-width: 400px;
  word-wrap: break-word;
}
.message-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}
.message-wrapper.self {
  justify-content: flex-end;
}
.message-wrapper.self .message-content {
  align-items: flex-end;
}
.message-wrapper.self .message-bubble {
  background-color: #409eff;
  color: #fff;
}
.message-wrapper.self .message-avatar {
  order: 1;
}
.chat-input {
  border-top: 1px solid #f0f2f5;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.chat-input .el-button {
  margin-top: 10px;
}
</style>