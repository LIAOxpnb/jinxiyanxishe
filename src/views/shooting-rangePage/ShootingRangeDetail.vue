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
              <el-tag type="info">{{ detail.shootingRangeCategoryName || '企业竞赛' }}</el-tag>
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
        
        <div class="action-button-wrapper">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { OfficeBuilding, Lock, ArrowRightBold } from '@element-plus/icons-vue';
import { getShootingRangeDetail, getShootingRangeResult } from '@/api/shooting-range.js';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const detail = ref(null);

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
        const 备注 = isQualified 
          ? '1、比武模式下,如果有证书显示证书;' 
          : '1、比武模式下,如果有证书显示证书;\n2、不合格无法查看证书。';
        
        ElMessageBox.confirm(
          `
            <div style="padding: 20px 0;">
              <p style="margin-bottom: 10px;"><strong>名称:</strong>${resultData.name || detail.value.name}</p>
              <p style="margin-bottom: 10px;"><strong>人员:</strong>${resultData.userName || 'Name'}</p>
              <p style="margin-bottom: 10px;"><strong>分数:</strong>${resultData.score || 0}分</p>
              <p style="margin-bottom: 10px;"><strong>结果:</strong>${isQualified ? '合格' : '不合格'}</p>
              <p style="margin-bottom: 10px;"><strong>排名:</strong>${totalParticipants}人参加,我排第${myRank}</p>
              <p style="color: red; margin-top: 15px;"><strong>【备注】</strong></p>
              <p style="color: red; white-space: pre-line;">${备注}</p>
            </div>
          `,
          '比武结果',
          {
            confirmButtonText: isQualified ? '查看证书' : '确定',
            cancelButtonText: '关闭',
            type: 'success',
            dangerouslyUseHTMLString: true,
            showCancelButton: true
          }
        )
          .then(() => {
            // 点击"查看证书"或"确定":跳转到结果详情页,使用靶场ID
            if (isQualified) {
              router.push({ name: 'ShootingRangeResult', params: { id: rangeId } });
            }
            // 不合格时点击"确定"不做任何操作
          })
          .catch(() => {
            // 点击"关闭":不做任何操作,留在详情页
          });
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
    
    // 其他状态下的正常处理
    if (challengeStatus.value >= STATUS_FINISHED) {
      router.push({ 
        name: 'TakeShootingRange', 
        params: { id: route.params.id },
        query: { tab: step.name === 'question' ? 'questions' : 'clues', readonly: 'true' }
      });
    } else {
      // 检查是否有暂存记录
      if (detail.value.shootingRangeRecord && detail.value.shootingRangeRecord.id) {
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
    // ElMessage.info('准备查看结果...');
    router.push({ name: 'ShootingRangeResult', params: { id: detail.value.id } });
  } else {
    // 检查是否有暂存记录
    if (detail.value.shootingRangeRecord && detail.value.shootingRangeRecord.id) {
      checkContinueRange(detail.value.shootingRangeRecord.id);
    } else {
      // 否则,进入或继续比武
      router.push({ name: 'TakeShootingRange', params: { id: route.params.id } });
    }
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
</style>