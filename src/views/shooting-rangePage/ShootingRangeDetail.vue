<template>
  <div class="range-detail-page" v-loading="loading">
    <div v-if="detail">
      <div class="banner">
        <div class="banner-content">
          <div class="banner-left">
            <h2><el-icon><OfficeBuilding /></el-icon> {{ detail.name }}</h2>
            <p>{{ detail.introduction }}</p>
            <div class="info-tags">
              <span>时间:{{ detail.participateDate === 0 ? '不限时' : `${detail.startTime} 至 ${detail.endTime}` }}</span>
              <span>时长:{{ detail.duration === -1 ? '不限时' : `${detail.duration}分钟` }}</span>
            </div>
            <div class="meta-tags">
              <el-tag :type="detail.shootingRangeType === 0 ? 'success' : 'warning'">
                {{ detail.shootingRangeType === 0 ? '训练' : '比武' }}
              </el-tag>
              <el-tag type="success">{{ detail.challengeMode === 1 ? '闯关模式' : '普通模式' }}</el-tag>
            </div>
          </div>
          <div class="banner-right">
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="step-indicator">
          <div v-for="step in steps" :key="step.num" class="step-item-wrapper">
            <div 
              class="step-item" 
              :class="getStepClass(step)" 
              @click="handleStepClick(step)"
            >
              <div class="step-num">STEP {{ step.num }}</div>
              <div class="step-title">{{ step.title }}</div>
              <div class="step-desc">{{ getStepDesc(step) }}</div>
              <div v-if="isStepLocked(step)" class="lock-icon"><el-icon><Lock /></el-icon></div>
            </div>
            <div v-if="step.arrow" class="arrow" :class="getStepClass(step)">
              <el-icon><ArrowRightBold /></el-icon>
            </div>
          </div>
        </div>
        
         <div class="action-button-wrapper" style="display: none;">
            <el-button 
              type="primary" 
              size="large" 
              @click="handleEnterRange" 
              :disabled="isEnterButtonDisabled"
            >
              {{ enterButtonText }}
            </el-button>
         </div>
      </div>
    </div>
    <el-empty v-else description="靶场详情加载失败"></el-empty>

    <!-- 证书预览弹窗 -->
    <el-dialog 
      v-model="certificateDialogVisible" 
      title="证书预览" 
      width="600px"
      align-center
      :close-on-click-modal="false"
    >
      <div class="certificate-preview-dialog">
        <div class="certificate-frame">
          <div 
            class="certificate-content" 
            :style="{ 
              backgroundImage: currentCertificate.backgroundUrl ? `url(${currentCertificate.backgroundUrl})` : 'linear-gradient(45deg, #e8f4f8 0%, #f0f8ff 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }"
          >
            <div class="certificate-overlay">
              <div class="certificate-header">
                <img src="@/assets/img/u42.png" alt="徽章" class="badge" />
              </div>
              
              <div class="certificate-title">
                {{ currentCertificate.name || '证书名称' }}
              </div>
              
              <div class="certificate-recipient">
                {{ currentCertificate.userName || '用户姓名' }} 同志
              </div>
              
              <div class="certificate-body">
                {{ currentCertificate.intro || '证书介绍内容' }}
              </div>
              
              <div class="certificate-footer">
                <div class="footer-content">
                  <div class="unit-date-info">
                    <div class="unit-name">{{ currentCertificate.unit || '单位名称' }}</div>
                    <div class="issue-date">{{ currentCertificate.issueDate || '2025年10月' }}</div>
                  </div>
                  <div class="seal-container">
                    <img 
                      v-if="currentCertificate.sealUrl"
                      :src="currentCertificate.sealUrl" 
                      alt="公章" 
                      class="seal-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="downloadCertificate">下载</el-button>
          <el-button type="primary" @click="certificateDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, ElButton } from 'element-plus';
import { OfficeBuilding, Lock, ArrowRightBold } from '@element-plus/icons-vue';
import { getShootingRangeDetail, getShootingRangeResult } from '@/api/shooting-range.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import html2canvas from 'html2canvas';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const detail = ref(null);

// 证书相关
const certificateDialogVisible = ref(false);
const currentCertificate = reactive({ 
  name: '', 
  intro: '',
  unit: '',
  issueDate: '',
  userName: '',
  backgroundUrl: '',
  sealUrl: ''
});

const steps = ref([
  { num: '01', title: '进入靶场', name: 'entry', arrow: 'right' },
  { num: '02', title: '线索分析', name: 'clue', arrow: 'right' },
  { num: '03', title: '案情研判', name: 'question', arrow: 'down' },
  { num: '06', title: '鉴定结果', name: 'result', arrow: 'left' },
  { num: '05', title: '报告鉴定', name: 'judgement', arrow: 'left' },
  { num: '04', title: '提交报告', name: 'submit', arrow: null }
]);

// 定义内部状态常量,更清晰
const STATUS_NOT_STARTED = -1; // 比武前
const STATUS_IN_PROGRESS = 0;  // 比武中
const STATUS_SUBMITTED = 1;    // 提交后/待鉴定
const STATUS_SYSTEM_REVIEWED = 2; // 系统修改已完成等待人工修改
const STATUS_FINISHED = 4;     // 鉴定完毕，可以查看结果

const challengeStatus = ref(STATUS_NOT_STARTED);

// --- 核心状态计算函数 ---

const getStepClass = (step) => {
  const s = challengeStatus.value;
  
  if (s >= STATUS_FINISHED) return 'completed';
  if (s === STATUS_SYSTEM_REVIEWED) {
    // status: 2 时，前面几步都已完成，鉴定和结果步骤为灰色
    return ['entry', 'clue', 'question', 'submit'].includes(step.name) ? 'completed' : 'disabled';
  }
  if (s === STATUS_SUBMITTED) return 'completed';
  if (s === STATUS_IN_PROGRESS) {
    return ['entry', 'clue', 'question', 'submit'].includes(step.name) ? 'active' : 'disabled';
  }
  if (s === STATUS_NOT_STARTED) {
    return step.name === 'entry' ? 'active' : 'disabled';
  }
  return 'disabled';
};

const getStepDesc = (step) => {
  const s = challengeStatus.value;
  switch(step.name) {
    case 'entry':
      if (s === STATUS_NOT_STARTED) return '未开始';
      if (s === STATUS_IN_PROGRESS) return '进行中';
      if (s >= STATUS_SUBMITTED) return '已结束';
      return '';
    case 'submit':
      if (s === STATUS_NOT_STARTED) return '提交报告等待鉴定';
      if (s === STATUS_IN_PROGRESS) return '提交报告等待鉴定';
      if (s === STATUS_SUBMITTED) return '已提交报告';
      if (s >= STATUS_SYSTEM_REVIEWED) return '已提交报告';
      return '提交报告等待鉴定';
    case 'judgement':
      if (s === STATUS_NOT_STARTED || s === STATUS_IN_PROGRESS) return '等待提交报告';
      if (s === STATUS_SUBMITTED) return '鉴定中,请等待';
      if (s === STATUS_SYSTEM_REVIEWED) return '人工审核中';
      if (s >= STATUS_FINISHED) return '鉴定完成';
      return '等待提交报告';
    case 'result':
      if (s === STATUS_NOT_STARTED || s === STATUS_IN_PROGRESS) return '鉴定完成后可查看';
      if (s === STATUS_SUBMITTED) return '鉴定完成后可查看';
      if (s === STATUS_SYSTEM_REVIEWED) return '人工审核完成后可查看';
      if (s >= STATUS_FINISHED) return '查看您的鉴定结果';
      return '鉴定完成后可查看';
    default:
      return step.title; // 默认显示标题
  }
};

const isStepLocked = (step) => {
  const s = challengeStatus.value;
  
  // status: 4 时，所有步骤都不锁定
  if (s >= STATUS_FINISHED) {
    return false;
  }
  
  // 报告鉴定步骤：只有在 status: 4 时才不锁定
  if (step.name === 'judgement') {
    return s < STATUS_FINISHED;
  }
  
  // 鉴定结果步骤：只有在 status: 4 时才不锁定
  if (step.name === 'result') {
    return s < STATUS_FINISHED;
  }
  
  // 提交报告步骤：status: 2 和 status: 4 时不锁定
  if (step.name === 'submit') {
    return s !== STATUS_SYSTEM_REVIEWED && s !== STATUS_FINISHED;
  }
  
  // 进入靶场相关步骤
  if (step.name === 'entry') return false;
  if (s === STATUS_NOT_STARTED) return true;
  if (s === STATUS_IN_PROGRESS) return ['judgement', 'result'].includes(step.name);
  if (s === STATUS_SUBMITTED || s === STATUS_SYSTEM_REVIEWED) return ['judgement', 'result'].includes(step.name);
  
  return false;
};

const enterButtonText = computed(() => {
  const s = challengeStatus.value;
  if (s === STATUS_NOT_STARTED) return '进入靶场';
  if (s === STATUS_IN_PROGRESS) return '继续比武';
  if (s === STATUS_SUBMITTED) return '查看结果'; 
  if (s === STATUS_SYSTEM_REVIEWED) return '查看结果';
  if (s >= STATUS_FINISHED) return '查看结果';
  return '进入靶场';
});

const isEnterButtonDisabled = computed(() => {
  // 在"待鉴定"和"人工审核中"状态下按钮不可用
  return challengeStatus.value === STATUS_SUBMITTED || challengeStatus.value === STATUS_SYSTEM_REVIEWED;
});

// 检查是否继续答题
const checkContinueRange = (recordId) => {
  ElMessageBox.confirm(
    '检测到您有未完成的答题记录,是否继续答题?',
    '提示',
    {
      confirmButtonText: '继续答题',
      cancelButtonText: '重新答题',
      type: 'warning',
      distinguishCancelAndClose: true,
    }
  )
    .then(() => {
      // 继续答题,带上recordId
      router.push({
        name: 'TakeShootingRange',
        params: { id: route.params.id },
        query: { recordId: recordId }
      });
    })
    .catch((action) => {
      if (action === 'cancel') {
        // 重新答题,带上recordId用于重置
        router.push({
          name: 'TakeShootingRange',
          params: { id: route.params.id },
          query: { recordId: recordId, restart: 'true' }
        });
      }
    });
};

// 显示结果弹窗
const showResultDialog = async (rangeId) => {
  try {
    const res = await getShootingRangeResult(rangeId);
    if (res.code === 200 && res.data) {
      const resultData = res.data;
      const isTraining = resultData.shootingRangeType === 0; // 0为训练,1为比武
      
      if (isTraining) {
        // 训练结果弹窗
        ElMessageBox.confirm(
          `
            <div style="padding: 20px 0;">
              <p style="margin-bottom: 10px;"><strong>名称:</strong>${resultData.name || detail.value.name}</p>
              <p style="margin-bottom: 10px;"><strong>分数:</strong>${resultData.score || 0}分</p>
            </div>
          `,
          '训练结果',
          {
            confirmButtonText: '查看结果',
            cancelButtonText: '关闭',
            type: 'success',
            dangerouslyUseHTMLString: true
          }
        )
          .then(() => {
            // 点击"查看结果":跳转到结果详情页,使用靶场ID
            router.push({ name: 'ShootingRangeResult', params: { id: rangeId } });
          })
          .catch(() => {
            // 点击"关闭":不做任何操作,留在详情页
          });
      } else {
        // 比武结果弹窗
        const isQualified = resultData.qualified === 1;
        const totalParticipants = resultData.totalCount || 0;
        const myRank = resultData.rank || '-';
        const hasCertificate = resultData.userCertificate && resultData.userCertificate.certificate;
        
        const messageContent = `
          <div style="padding: 20px 0;">
            <p style="margin-bottom: 10px;"><strong>名称:</strong>${resultData.name || detail.value.name}</p>
            <p style="margin-bottom: 10px;"><strong>人员:</strong>${resultData.userName || 'Name'}</p>
            <p style="margin-bottom: 10px;"><strong>分数:</strong>${resultData.score || 0}分</p>
            <p style="margin-bottom: 10px;"><strong>结果:</strong>${isQualified ? '合格' : '不合格'}</p>
            <p style="margin-bottom: 10px;"><strong>排名:</strong>${totalParticipants}人参加,我排第${myRank}</p>
            ${hasCertificate && isQualified ? '<p style="margin-bottom: 10px; color: #67C23A;"><strong>✓ 已获得证书</strong></p>' : ''}
          </div>
        `;
        
        // 使用自定义按钮
        ElMessageBox({
          title: '比武结果',
          message: h('div', { innerHTML: messageContent }),
          dangerouslyUseHTMLString: true,
          showCancelButton: false,
          showConfirmButton: false,
          customClass: 'shooting-range-result-dialog',
        }).then(() => {}).catch(() => {});
        
        // 手动添加按钮
        setTimeout(() => {
          const dialog = document.querySelector('.shooting-range-result-dialog');
          if (dialog) {
            const footer = dialog.querySelector('.el-message-box__btns');
            if (footer) {
              footer.innerHTML = '';
              
              // 创建"查看结果"按钮
              const viewResultBtn = document.createElement('button');
              viewResultBtn.className = 'el-button el-button--primary';
              viewResultBtn.textContent = '查看结果';
              viewResultBtn.onclick = () => {
                document.querySelector('.shooting-range-result-dialog .el-message-box__headerbtn')?.click();
                router.push({ name: 'ShootingRangeResult', params: { id: rangeId } });
              };
              footer.appendChild(viewResultBtn);
              
              // 如果有证书且合格，创建"查看证书"按钮
              if (hasCertificate && isQualified) {
                const viewCertBtn = document.createElement('button');
                viewCertBtn.className = 'el-button el-button--success';
                viewCertBtn.textContent = '查看证书';
                viewCertBtn.style.marginLeft = '10px';
                viewCertBtn.onclick = () => {
                  document.querySelector('.shooting-range-result-dialog .el-message-box__headerbtn')?.click();
                  viewCertificate(resultData.userCertificate.certificate);
                };
                footer.appendChild(viewCertBtn);
              }
              
              // 创建"关闭"按钮
              const closeBtn = document.createElement('button');
              closeBtn.className = 'el-button';
              closeBtn.textContent = '关闭';
              closeBtn.style.marginLeft = '10px';
              closeBtn.onclick = () => {
                document.querySelector('.shooting-range-result-dialog .el-message-box__headerbtn')?.click();
              };
              footer.appendChild(closeBtn);
            }
          }
        }, 100);
      }
    }
  } catch (error) {
    ElMessage.error('获取结果失败');
  }
};

// --- 事件处理 ---
const handleStepClick = (step) => {
  // 只检查是否锁定，不检查样式类，因为完成状态下的步骤应该可以点击
  if (isStepLocked(step)) return;
  
  if (['entry', 'clue', 'question'].includes(step.name)) {
    // 当状态为完全完成（STATUS_FINISHED = 4）时，不允许点击这些步骤
    if (challengeStatus.value === STATUS_FINISHED) {
      return;
    }
    
    // 已提交报告后（STATUS_SUBMITTED 及以上），不允许继续答题
    if (challengeStatus.value >= STATUS_SUBMITTED) {
      ElMessage.warning('已提交报告，无法继续答题');
      return;
    }
    
    // 其他状态下的正常处理
    if (challengeStatus.value >= STATUS_FINISHED) {
      router.push({ 
        name: 'TakeShootingRange', 
        params: { id: route.params.id },
        query: { tab: step.name === 'question' ? 'questions' : 'clues', readonly: 'true' }
      });
    } else {
      // 检查是否有暂存记录（仅在比武中状态）
      if (challengeStatus.value === STATUS_IN_PROGRESS && detail.value.shootingRangeRecord && detail.value.shootingRangeRecord.id) {
        checkContinueRange(detail.value.shootingRangeRecord.id);
      } else {
        router.push({ 
          name: 'TakeShootingRange', 
          params: { id: route.params.id },
          query: { tab: step.name === 'question' ? 'questions' : 'clues' }
        });
      }
    }
  } else if (step.name === 'result' && challengeStatus.value >= STATUS_FINISHED) {
    // 点击结果步骤显示结果弹窗,使用靶场ID
    showResultDialog(detail.value.id);
  }
};

const handleEnterRange = () => {
  if (isEnterButtonDisabled.value) return;
  // 如果已结束,按钮是"查看结果",则跳转到结果页
  if (challengeStatus.value >= STATUS_FINISHED) {
    // 使用靶场ID
    router.push({ name: 'ShootingRangeResult', params: { id: detail.value.id } });
  } else {
    // 检查是否有暂存记录（仅在比武中状态）
    if (challengeStatus.value === STATUS_IN_PROGRESS && detail.value.shootingRangeRecord && detail.value.shootingRangeRecord.id) {
      checkContinueRange(detail.value.shootingRangeRecord.id);
    } else {
      // 否则,进入或继续比武
      router.push({ name: 'TakeShootingRange', params: { id: route.params.id } });
    }
  }
};

// 查看证书
const viewCertificate = async (cert) => {
  // 异步获取背景图和公章的URL
  const [backgroundUrl, sealUrl] = await Promise.all([
    cert.background ? previewFile(cert.background).catch(() => '') : Promise.resolve(''),
    cert.officialSeal ? previewFile(cert.officialSeal).catch(() => '') : Promise.resolve('')
  ]);
  
  // 处理颁发日期格式
  let issueDate = cert.issueDate === 0 ? cert.unifyTime : cert.issueDate;
  if (issueDate && issueDate.includes('-')) {
    const [year, month] = issueDate.split('-');
    issueDate = `${year}年${parseInt(month, 10)}月`;
  }
  
  Object.assign(currentCertificate, {
    name: cert.name || '',
    intro: cert.intro || '',
    unit: cert.unit || '',
    issueDate: issueDate || '',
    userName: detail.value?.userName || '用户姓名',
    backgroundUrl: backgroundUrl,
    sealUrl: sealUrl
  });
  
  certificateDialogVisible.value = true;
};

// 下载证书
const downloadCertificate = async () => {
  try {
    const certificateElement = document.querySelector('.certificate-preview-dialog .certificate-frame');
    if (!certificateElement) {
      ElMessage.warning('未找到证书元素');
      return;
    }

    // 显示加载提示
    const loadingMsg = ElMessage.info({ message: '正在生成证书图片...', duration: 0 });

    // 使用 html2canvas 将证书元素转换为 canvas
    const canvas = await html2canvas(certificateElement, {
      backgroundColor: null,
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      logging: false,
      imageTimeout: 0,
      allowTaint: true
    });

    // 关闭加载提示
    loadingMsg.close();

    // 将 canvas 转换为 Blob
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentCertificate.name || '证书'}.png`;
      link.click();
      URL.revokeObjectURL(url);
      ElMessage.success('证书下载成功');
    }, 'image/png');
  } catch (error) {
    console.error('下载证书失败:', error);
    ElMessage.error('下载证书失败');
  }
};

onMounted(async () => {
  const id = route.params.id;
  try {
    const res = await getShootingRangeDetail(id);
    if (res.code === 200 && res.data) {
      detail.value = res.data;
      console.log('靶场详情数据:', res.data);
      console.log('shootingRangeRecord:', res.data.shootingRangeRecord);
      
      // 根据后端返回的 shootingRangeRecord 来确定当前状态
      if (detail.value.shootingRangeRecord === null) {
        challengeStatus.value = STATUS_NOT_STARTED; // 比武前
        console.log('设置状态为: STATUS_NOT_STARTED (-1)');
      } else {
        const recordStatus = detail.value.shootingRangeRecord.status;
        console.log('原始status值:', recordStatus);
        
        // 根据新的状态映射逻辑
        if (recordStatus === 0) {
          challengeStatus.value = STATUS_IN_PROGRESS; // 比武中
          console.log('设置状态为: STATUS_IN_PROGRESS (0)');
        } else if (recordStatus === 1) {
          challengeStatus.value = STATUS_SUBMITTED; // 待鉴定
          console.log('设置状态为: STATUS_SUBMITTED (1)');
        } else if (recordStatus === 2) {
          challengeStatus.value = STATUS_SYSTEM_REVIEWED; // 系统修改已完成等待人工修改
          console.log('设置状态为: STATUS_SYSTEM_REVIEWED (2)');
        } else if (recordStatus === 4) {
          challengeStatus.value = STATUS_FINISHED; // 鉴定完毕
          console.log('设置状态为: STATUS_FINISHED (4)');
        } else {
          // 默认处理
          challengeStatus.value = STATUS_NOT_STARTED;
          console.log('设置状态为: STATUS_NOT_STARTED (默认，未知status:', recordStatus, ')');
        }
      }
      
      console.log('最终challengeStatus:', challengeStatus.value);
    } else {
      ElMessage.error(res.msg || '加载详情失败');
    }
  } catch (error) {
    ElMessage.error('网络错误');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.range-detail-page { background-color: #f5f7fa; }
.banner { 
  padding: 110px; 
  background-image: url('@/assets/img/123111.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white; 
}
.banner-content { display: flex; justify-content: space-between; max-width: 1200px; margin: auto; }
.banner h2 { font-size: 24px; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;}
.banner p { font-size: 14px; margin: 0 0 16px 0; opacity: 0.9; }
.info-tags, .meta-tags { display: flex; gap: 16px; font-size: 13px; }
.meta-tags { margin-top: 10px; }
.main-content { background-color: #fff; padding: 40px; }
.step-indicator { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); gap: 20px 40px; max-width: 1000px; margin: auto; }
.step-item-wrapper { position: relative; display: flex; align-items: center; }
.step-item { flex: 1; padding: 20px; border-radius: 8px; position: relative; transition: all 0.3s ease; }
.step-item.active { background-color: #409eff; color: white; cursor: pointer; }
.step-item.completed { background-color: #409eff; color: white; } /* 已完成也用蓝色 */
.step-item.disabled { background-color: #f0f2f5; color: #c0c4cc; cursor: not-allowed; }
.step-num { font-size: 12px; opacity: 0.8; }
.step-title { font-size: 20px; font-weight: bold; margin: 8px 0; }
.step-desc { font-size: 13px; }
.lock-icon { position: absolute; right: 15px; top: 15px; font-size: 24px; opacity: 0.5; }
.arrow { position: absolute; font-size: 24px; color: #dcdfe6; }
.arrow.active, .arrow.completed { color: #409eff; }
.arrow.right { right: -30px; }
.arrow.down { top: 100%; left: 50%; transform: translateX(-50%) rotate(90deg); margin-top: 10px;}
.arrow.left { left: -30px; transform: rotate(180deg); }
.action-button-wrapper { text-align: center; margin-top: 40px; }

/* 【完整复制】证书预览对话框样式 - 从 MyPage.vue */
.certificate-preview-dialog { 
  display: flex; 
  justify-content: center; 
}

.certificate-frame {
  width: 450px;
  height: 650px;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 3px rgba(139, 69, 19, 0.2);
  position: relative;
}

.certificate-frame::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  pointer-events: none;
}

.certificate-content {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
}

.certificate-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 8px dashed #4a90a4;
  pointer-events: none;
  z-index: 1;
  opacity: 0.8;
}

.certificate-overlay {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 15px 10px 15px;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(2px);
}

.certificate-header {
  margin-bottom: 15px;
  position: relative;
}

.certificate-header::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(to right, transparent, #d4af37, transparent);
}

.badge {
  width: 50px;
  height: 50px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  animation: badge-shine 3s ease-in-out infinite;
}

@keyframes badge-shine {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.certificate-title {
  font-size: 40px;
  font-weight: bold;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 50px;
  text-align: center;
  letter-spacing: 3px;
  position: relative;
  text-shadow: 2px 2px 4px rgba(255, 255, 255, 0.5);
}

.certificate-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(to right, transparent, #d4af37, transparent);
}

.certificate-recipient {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 50px;
  text-align: center;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 8px 20px;
  background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.1), transparent);
  border-left: 3px solid #d4af37;
  border-right: 3px solid #d4af37;
}

.certificate-body {
    font-size: 15px;
  line-height: 1.8;
  color: #2c3e50;
  text-align: center;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
  max-width: 380px;
  margin: 0 auto;
  word-wrap: break-word;
  word-break: break-all;
  white-space: pre-wrap;
}

.certificate-footer {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: -40px;
}
  
.footer-content {
  margin-top: 160px;
  display: flex;
  align-items: center;
  width: 100%;
  flex-direction: column-reverse;
}

.unit-date-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -30px; /* 使文字上移，与公章重叠 */
  position: relative;
  z-index: 1; /* 文字图层为 1，低于公章 */
}

.unit-name {
  font-size: 17px;
  color: #2c3e50;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.issue-date {
  font-size: 13px;
  color: #2c3e50;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.seal-container {
  position: relative;
  flex-shrink: 0;
  z-index: 2; /* 公章图层为 2，高于文字 */
  filter: drop-shadow(0 4px 8px rgba(231, 76, 60, 0.3));
}

.seal-image {
  width: 84px;
  height: 84px;
  object-fit: contain;
  border-radius: 50%;
  animation: seal-float 4s ease-in-out infinite;
}

@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
</style>