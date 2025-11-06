<template>
  <div class="range-setup-page" v-loading="loading">
    <div v-if="shootingRangeDetails">
      <el-page-header @back="goBack">
        <template #content>
          <span class="page-header-title">{{ shootingRangeDetails.name || '靶场设置' }}</span>
        </template>
      </el-page-header>

      <div class="main-layout">
        <div class="left-panel">
          <el-card>
            <template #header>
              <div class="left-panel-header">
                <div class="stats-bar">
                  <el-dropdown @command="handleAddItem">
                    <el-button type="primary">
                      新增内容<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="ADD_CLUE">添加线索</el-dropdown-item>
                        <el-dropdown-item command="SINGLE_CHOICE" divided>单选题</el-dropdown-item>
                        <el-dropdown-item command="MULTIPLE_CHOICE">多选题</el-dropdown-item>
                        <el-dropdown-item command="TRUE_FALSE">判断题</el-dropdown-item>
                        <el-dropdown-item command="FILL_IN_BLANK">填空题</el-dropdown-item>
                        <el-dropdown-item command="ESSAY">论述题</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span>试题数 <span class="stat-value">{{ totalQuestions }}</span> 道</span>
                  <span>总分 <span class="stat-value">{{ totalScore }}</span> 分</span>
                  <span>合格分 <span class="stat-value">{{ shootingRangeDetails.qualified || 0 }}</span> 分</span>
                  <el-button type="primary" link @click="openBatchSetScoreDialog">批量设置分数</el-button>
                  <el-dropdown @command="handleScoreCommands">
                    <el-button type="primary" link>
                      设置合格分<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="setPassingScore">设置合格分</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <span v-if="lastSaveTime" class="save-status">
                    <el-icon class="save-icon"><Check /></el-icon>
                    已自动保存 {{ formatSaveTime(lastSaveTime) }}
                  </span>
                  <span v-else-if="hasUnsavedChanges" class="unsaved-status">
                    <el-icon class="unsaved-icon"><Loading /></el-icon>
                    保存中...
                  </span>
                  <el-button type="success" @click="saveCluesAndQuestions" style="margin-left: auto;">手动保存</el-button>
                </div>
              </div>
            </template>
            <div class="content-list-container">
              <div class="section-title">靶场线索</div>
              <el-empty v-if="clues.length === 0" description="暂无线索" :image-size="80" />
              <div v-for="(clue, index) in clues" :key="clue.uid" class="item-card">
                 <div class="card-header">
                    <span class="item-index">线索 {{ index + 1 }}</span>
                    <div class="item-actions">
                        <el-button :icon="Top" circle plain size="small" @click="moveClueUp(index)" :disabled="index === 0" title="上移" />
                        <el-button :icon="Bottom" circle plain size="small" @click="moveClueDown(index)" :disabled="index === clues.length - 1" title="下移" />
                        <el-button :icon="Edit" circle plain size="small" @click="editClue(index)" title="编辑" />
                        <el-button :icon="Delete" circle plain type="danger" size="small" @click="deleteClue(index)" title="删除" />
                    </div>
                 </div>
                 <div class="item-body">
                    <div class="item-title" v-html="clue.title"></div>
                    <div v-if="clue.fileName" class="item-attachment">
                        <el-icon><Document /></el-icon> 
                        <a @click.prevent="previewClueFile(clue)">{{ clue.fileName }}</a>
                    </div>
                 </div>
              </div>
              
              <el-divider />

              <div class="section-title">靶场试题</div>
              <div v-for="(question, index) in questionList" :key="question.uid" class="item-card">
                <div class="card-header">
                  <div class="header-left">
                    <span class="item-index">【{{ getQuestionTypeName(question.questionType) }}】第 {{ index + 1 }} 题</span>
                    <div class="item-score">
                      <span>分数:</span>
                      <el-input-number v-model="question.score" :min="0" :max="100" controls-position="right" size="small" />
                    </div>
                  </div>
                  <div class="item-actions">
                    <el-button :icon="Top" circle plain size="small" @click="moveQuestionUp(index)" :disabled="index === 0" title="上移" />
                    <el-button :icon="Bottom" circle plain size="small" @click="moveQuestionDown(index)" :disabled="index === questionList.length - 1" title="下移" />
                    <el-button :icon="Edit" circle plain size="small" @click="toggleQuestionEditor(index)" :title="question.showEditor ? '收起' : '展开'" />
                    <el-button :icon="CopyDocument" circle plain size="small" @click="copyQuestion(index)" title="复制" />
                    <el-button :icon="Delete" circle plain type="danger" size="small" @click="handleDeleteQuestion(index)" title="删除" />
                  </div>
                </div>
                <div class="item-body">
                  <QuestionEditor
                    v-if="question.showEditor"
                    :index="index"
                    v-model="questionList[index]"
                    :hide-header="true"
                    @delete="handleDeleteQuestion(index)"
                    @copy="copyQuestion(index)"
                    style="border: none; box-shadow: none;"
                  />
                  <div v-else class="question-preview">
                    <div class="question-title" v-html="question.title || '(未填写题目内容)'"></div>
                  </div>
                </div>
              </div>
              <el-empty v-if="questionList.length === 0" description="请从【新增内容】下拉菜单中添加试题" :image-size="80" />
            </div>
          </el-card>
        </div>

        <div class="right-panel">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>靶场信息</span>
                <el-button type="primary" link :icon="Edit" @click="openBasicInfoDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="靶场名称">{{ shootingRangeDetails.name }}</el-descriptions-item>
              <el-descriptions-item label="靶场简介">{{ shootingRangeDetails.introduction }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ categoryName }}</el-descriptions-item>
              <el-descriptions-item label="靶场类型">{{ shootingRangeDetails.shootingRangeType === 0 ? '训练' : '比武' }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ shootingRangeDetails.creatorName }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ shootingRangeDetails.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card>
            <template #header>
              <div class="card-header">
                <span>靶场设置</span>
                <el-button type="primary" link :icon="Edit" @click="openRangeSettingsDialog">编辑</el-button>
              </div>
            </template>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="闯关模式">{{ shootingRangeDetails.challengeMode === 1 ? '开启' : '关闭' }}</el-descriptions-item>
              <el-descriptions-item label="比武时间">{{ shootingRangeDetails.participateDate === 0 ? '不限制' : `${shootingRangeDetails.startTime} ~ ${shootingRangeDetails.endTime}` }}</el-descriptions-item>
              <el-descriptions-item label="比武时长">{{ shootingRangeDetails.duration === -1 ? '不限制' : `${shootingRangeDetails.duration}分钟` }}</el-descriptions-item>
              <el-descriptions-item label="比武人员">{{ ['不限制', '指定人员', '指定班级'][shootingRangeDetails.scope] || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="禁止复制">{{ shootingRangeDetails.disableCopy === 1 ? '开启' : '关闭' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

           <el-card>
            <template #header>
              <span>证书</span>
            </template>
            <div class="certificate-section">
                <!-- <div class="form-hint">【备注】初始状态人员显示为未颁定</div> -->
                <div>暂无证书，请联系管理员配置</div>
                <el-button disabled>证书名称</el-button>
            </div>
          </el-card>

          <div class="action-buttons">
            <el-button 
              :type="shootingRangeDetails.status === 1 ? 'danger' : 'primary'" 
              @click="togglePublishStatus"
            >
              {{ shootingRangeDetails.status === 1 ? '取消发布' : '发布' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <el-empty v-else-if="!loading" description="未找到该靶场的相关信息"></el-empty>
    
    <QuestionEditDialog v-model:visible="editDialogVisible" :question-id="editQuestionId" @success="fetchShootingRangeDetails" />

    <el-dialog v-model="clueEditorVisible" title="线索编辑" width="800px" :close-on-click-modal="false" @close="destroyClueEditor">
      <el-form v-if="clueEditorVisible" :model="clueForm" label-width="80px">
        <el-form-item label="线索内容">
          <div style="border: 1px solid #ccc">
            <Toolbar
              style="border-bottom: 1px solid #ccc"
              :editor="editorRef"
              :defaultConfig="{}"
            />
            <Editor
              style="height: 300px; overflow-y: hidden;"
              v-model="clueForm.title"
              @onCreated="handleClueEditorCreated"
            />
          </div>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            :file-list="attachmentList"
            action="#"
            :http-request="handleAttachmentUpload"
            :on-remove="handleAttachmentRemove"
            :limit="1"
          >
            <el-button type="primary" link>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                单个文件小于100M，支持pdf、doc、docx、xls、xlsx、mp3、mp4格式。
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="clueEditorVisible = false">取消</el-button>
          <el-button type="primary" @click="saveClue">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="basicInfoDialogVisible" title="修改靶场基本信息" width="600px">
      <el-form v-if="editForm" :model="editForm" label-width="80px">
        <el-form-item label="靶场名称" prop="name">
          <el-input v-model="editForm.name" maxlength="30" show-word-limit />
          <div class="form-hint">【备注】名称重复性校验</div>
        </el-form-item>
        <el-form-item label="靶场简介" prop="introduction">
          <el-input v-model="editForm.introduction" type="textarea" :rows="3" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="shootingRangeCategory">
          <el-select v-model="editForm.shootingRangeCategory" placeholder="选择分类" style="width:100%;">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="靶场类型" prop="shootingRangeType">
           <el-radio-group v-model="editForm.shootingRangeType" disabled>
            <el-radio :value="0">训练</el-radio>
            <el-radio :value="1">比武</el-radio>
          </el-radio-group>
           <div class="form-hint">【备注】类型不可修改</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="basicInfoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rangeSettingsDialogVisible" title="靶场设置" width="600px">
      <el-form v-if="editForm" :model="editForm" label-width="90px">
        <el-form-item label="闯关模式">
          <el-radio-group v-model="editForm.challengeMode">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="参加时间">
          <el-radio-group v-model="editForm.participateDate">
            <el-radio :value="0">不限制</el-radio>
            <el-radio :value="1">指定时间</el-radio>
          </el-radio-group>
          <div v-if="editForm.participateDate === 1" style="margin-top: 10px;">
            <el-date-picker v-model="timeRange" type="datetimerange" range-separator="至" start-placeholder="选择开始时间"
              end-placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
          </div>
        </el-form-item>
        <el-form-item label="靶场时长">
          <el-radio-group v-model="editForm.duration" @change="(val) => { if (val !== -1) isDurationLimited = true }">
            <el-radio :label="-1">不限制</el-radio>
            <el-radio :label="customDuration > 0 ? customDuration : 30" @change="isDurationLimited = true">限制</el-radio>
          </el-radio-group>
          <el-input-number v-if="isDurationLimited" v-model="customDuration" :min="30" :max="300" @change="(val) => editForm.duration = val" controls-position="right" style="margin-left: 10px;" />
          <span v-if="isDurationLimited" style="margin-left: 5px;">分钟</span>
          <div class="form-hint">【备注】最低30分钟，最高不超过300分钟</div>
        </el-form-item>
        <el-form-item label="参加人员">
          <el-radio-group v-model="editForm.scope">
            <el-radio :value="1">指定人员</el-radio>
            <el-radio :value="2">指定班级</el-radio>
          </el-radio-group>
          <div v-if="editForm.scope === 1" style="margin-top: 10px; width: 100%;">
            <div class="selected-users-display">
              <div v-if="selectedScopeUsers.length === 0" class="no-selection">
                未选择人员
              </div>
              <div v-else class="selection-summary">
                已选择 {{ selectedScopeUsers.length }} 人
                <div class="selected-list">
                  <el-tag v-for="user in selectedScopeUsers.slice(0, 5)" :key="user.id" closable
                    @close="removeSelectedUser(user)" style="margin: 2px;">
                    {{ user.name }}
                  </el-tag>
                  <span v-if="selectedScopeUsers.length > 5" class="more-items">
                    等{{ selectedScopeUsers.length }}人
                  </span>
                </div>
              </div>
            </div>
            <el-button type="primary" @click="openUserSelectionDialog" style="margin-top: 10px;">
              {{ selectedScopeUsers.length > 0 ? '修改人员' : '选择人员' }}
            </el-button>
            <div class="form-hint">【备注】仅选择的人员可参加当前靶场</div>
          </div>
          <div v-if="editForm.scope === 2" style="margin-top: 10px; width: 100%;">
            <div class="selected-classes-display">
              <div v-if="selectedScopeClasses.length === 0" class="no-selection">
                未选择班级
              </div>
              <div v-else class="selection-summary">
                已选择 {{ selectedScopeClasses.length }} 个班级
                <div class="selected-list">
                  <el-tag v-for="clazz in selectedScopeClasses.slice(0, 5)" :key="clazz.id" closable
                    @close="removeSelectedClass(clazz)" style="margin: 2px;">
                    {{ clazz.name }} ({{ clazz.userCount }}人)
                  </el-tag>
                  <span v-if="selectedScopeClasses.length > 5" class="more-items">
                    等{{ selectedScopeClasses.length }}个班级
                  </span>
                </div>
              </div>
            </div>
            <el-button type="primary" @click="openClassSelectionDialog" style="margin-top: 10px;">
              {{ selectedScopeClasses.length > 0 ? '修改班级' : '选择班级' }}
            </el-button>
            <div class="form-hint">【备注】仅选择的班级可选择当前靶场</div>
          </div>
        </el-form-item>
        <el-form-item label="禁止复制">
          <el-radio-group v-model="editForm.disableCopy">
            <el-radio :value="1">开启</el-radio>
            <el-radio :value="0">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rangeSettingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">确定</el-button>
      </template>
    </el-dialog>
    
    
    <el-dialog v-model="batchSetScoreDialogVisible" title="批量设置分数" width="500px">
      <el-form :model="batchScoreForm" label-width="80px">
        <el-form-item v-for="item in questionTypesForBatchScore" :key="item.type">
          <template #label>{{ item.name }}</template>
          <span class="dialog-stat-text">共{{ questionCountsByType[item.type] || 0 }}题</span>
          <span class="dialog-stat-text">单题</span>
          <el-input-number v-model="batchScoreForm[item.type]" :min="0" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分, 共{{ (questionCountsByType[item.type] || 0) * (batchScoreForm[item.type] ||
            0)
          }}分</span>
        </el-form-item>
        <el-divider />
        <el-form-item label="总共">
          <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
          <span style="margin-left: 20px;">总分 <span class="stat-value">{{ calculatedTotalScore }}</span> 分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSetScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBatchScores">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="setPassingScoreDialogVisible" title="合格分设置" width="500px">
      <el-form :model="passingScoreForm" label-width="80px">
        <el-form-item label="总共">
          <span class="dialog-stat-text">共{{ totalQuestions }}题</span>
          <span class="dialog-stat-text">合格</span>
          <el-input-number v-model="passingScoreForm.qualified" :min="0" :max="totalScore" controls-position="right"
            style="width: 100px;" />
          <span class="dialog-stat-text">分, 共{{ totalScore }}分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="setPassingScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPassingScore">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userSelectionDialogVisible" title="选择人员" width="1000px" :close-on-click-modal="false">
        <div class="add-member-dialog">
          <div class="user-tree-section">
            <div class="search-section">
              <el-input v-model="userSearchKeyword" placeholder="姓名、手机号、警号、身份证号" @input="handleUserSearch" clearable>
                <template #append><el-button @click="handleUserSearch"><el-icon><Search /></el-icon></el-button></template>
              </el-input>
            </div>
            <div class="user-tree-container">
              <!-- 搜索结果 -->
              <div v-if="userSearchKeyword" class="search-results">
                <div class="search-tip">
                  包含 "{{ userSearchKeyword }}" 的搜索结果
                </div>
                <div v-for="user in searchedUsers" :key="user.id" class="user-item search-result">
                  <el-checkbox v-model="user.checked" @change="handleUserCheck(user)">
                    <div class="user-info">
                      <el-avatar :size="24" :src="user.avatar">
                        <el-icon>
                          <User />
                        </el-icon>
                      </el-avatar>
                      <span class="user-name">{{ user.name }}</span>
                      <span class="user-dept">{{ user.department }}</span>
                    </div>
                  </el-checkbox>
                </div>
              </div>

              <!-- 组织树 -->
              <div v-else class="org-tree">
                <el-tree ref="orgTreeRef" :data="orgTreeData" :props="{ children: 'children', label: 'name' }" show-checkbox node-key="id" :default-expand-all="true" @check="handleOrgTreeCheck">
                  <template #default="{ data }">
                    <div class="tree-node">
                      <el-icon v-if="data.type === 'org'" class="org-icon"><OfficeBuilding /></el-icon>
                      <el-avatar v-else :size="20" :src="data.avatar"><el-icon><User /></el-icon></el-avatar>
                      <span class="node-label">{{ data.name }}</span>
                      <span v-if="data.type === 'user'" class="user-dept">{{ data.department }}</span>
                    </div>
                  </template>
                </el-tree>
              </div>
            </div>
          </div>
          <div class="selected-users-section">
            <div class="section-header">
              <span>已选：{{ selectedScopeUsers.length }} 名用户</span>
              <el-button type="text" @click="clearSelectedUsers">清空</el-button>
            </div>
            <div class="selected-users-list-dialog">
              <div v-for="user in selectedScopeUsers" :key="user.id" class="selected-user-item">
                <el-avatar :size="32" :src="user.avatar"><el-icon><User /></el-icon></el-avatar>
                <div class="user-details"><div class="user-name">{{ user.name }}</div><div class="user-dept">{{ user.department }}</div></div>
                <el-button type="text" class="remove-btn" @click="removeSelectedUser(user)"><el-icon><Close /></el-icon></el-button>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="userSelectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedUsers">确定</el-button>
        </template>
    </el-dialog>
    
    <el-dialog v-model="classSelectionDialogVisible" title="选择班级" width="1000px" :close-on-click-modal="false">
        <div class="add-class-dialog">
          <div class="class-list-section">
            <!-- 标签页切换 -->
            <div class="class-tabs">
              <el-radio-group v-model="classTabActive" @change="handleClassTabChange">
                <el-radio-button label="my">我的班级</el-radio-button>
                <el-radio-button label="all">全部班级</el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="search-section">
              <el-input v-model="classSearchKeyword" placeholder="班级名称" @input="handleClassSearch" clearable>
                <template #append><el-button @click="handleClassSearch"><el-icon><Search /></el-icon></el-button></template>
              </el-input>
            </div>
            <div class="class-list-container">
              <div v-for="clazz in classListData" :key="clazz.id" class="class-item" :class="{ 'disabled-class': clazz.disabled }">
                <el-checkbox v-model="clazz.checked" @change="handleClassCheck(clazz)" :disabled="clazz.disabled">
                  <div class="class-info">
                    <el-icon class="class-icon"><OfficeBuilding /></el-icon>
                    <div class="class-details"><span class="class-name">{{ clazz.name }}</span><span class="class-members">({{ clazz.userCount }}人)</span><span v-if="clazz.disabled" class="status-tag">已结束</span></div>
                  </div>
                </el-checkbox>
              </div>
            </div>
            <div class="class-pagination">
              <span class="pagination-info">共{{ classTotal }}条</span>
              <el-pagination v-model:current-page="classCurrentPage" v-model:page-size="classPageSize" :total="classTotal" layout="prev, pager, next" @current-change="handleClassPageChange" size="small" />
            </div>
          </div>
          <div class="selected-classes-section">
            <div class="section-header">
              <span>已选：{{ selectedScopeClasses.length }} 个班级</span>
              <el-button type="text" @click="clearSelectedClasses">清空</el-button>
            </div>
            <div class="selected-classes-list-dialog">
              <div v-for="clazz in selectedScopeClasses" :key="clazz.id" class="selected-class-item">
                <el-icon class="class-icon"><OfficeBuilding /></el-icon>
                <div class="class-details"><div class="class-name">{{ clazz.name }}</div><div class="class-members">{{ clazz.userCount }}人</div></div>
                <el-button type="text" class="remove-btn" @click="removeSelectedClass(clazz)"><el-icon><Close /></el-icon></el-button>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="classSelectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelectedClasses">确定</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, shallowRef, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getShootingRangeDetail, updateShootingRange, setClueAndQuestionList, setShootingRangeQualified, updateShootingRangeStatus } from '@/api/teaching-center/ShootingRange.js';
import { getDictData } from '@/api/system-management/dictionary';
import { getUserList } from '@/api/system-management/User.js';
import { getAllOrgTree } from '@/api/system-management/Org.js';
import { getClassList } from '@/api/teaching-center/ClassManagement.js';
import { Edit, ArrowDown, Delete, Document, Top, Bottom, Search, User, OfficeBuilding, Close, CopyDocument, Check, Loading } from '@element-plus/icons-vue';
import QuestionEditor from '@/components/question/QuestionEditor.vue';
import { v4 as uuidv4 } from 'uuid';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { uploadFiles } from '@/api/common/UploadFiles.js';
import { previewFile } from '@/api/common/PreviewFile.js';
import ExamQuestionCard from '@/components/exam/ExamQuestionCard.vue'; 
import QuestionSelector from '@/components/question/QuestionSelector.vue';
import QuestionEditDialog from '@/components/question/QuestionEditDialog.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const rangeId = ref(null);
const shootingRangeDetails = ref(null);
const clues = ref([]);
const questionList = ref([]);
const editDialogVisible = ref(false);
const editQuestionId = ref(null);

const basicInfoDialogVisible = ref(false);
const rangeSettingsDialogVisible = ref(false);
const editForm = ref(null);
const categoryOptions = ref([]);

const isDurationLimited = ref(false);
const customDuration = ref(30);

const userSelectionDialogVisible = ref(false);
const classSelectionDialogVisible = ref(false);
const selectedScopeUsers = ref([]);
const selectedScopeClasses = ref([]);
const orgTreeData = ref([]);
const orgTreeRef = ref(null);
const userSearchKeyword = ref('');
const searchedUsers = ref([]);
const classListData = ref([]);
const classSearchKeyword = ref('');
const classCurrentPage = ref(1);
const classPageSize = ref(10);
const classTotal = ref(0);
const classTabActive = ref('my'); // 'my' 或 'all'

const clueEditorVisible = ref(false);
const editorRef = shallowRef(null);
const clueForm = ref(null);
const attachmentList = ref([]);

// 自动保存相关状态
const STORAGE_KEY_PREFIX = 'shooting_range_draft_';
const lastSaveTime = ref(null);
const hasUnsavedChanges = ref(false);
let saveTimer = null;

// 批量设置分数相关
const batchSetScoreDialogVisible = ref(false);
const batchScoreForm = ref({
  SINGLE_CHOICE: 5,
  MULTIPLE_CHOICE: 5,
  TRUE_FALSE: 5,
  FILL_IN_BLANK: 5,
  ESSAY: 10
});

// 设置合格分相关
const setPassingScoreDialogVisible = ref(false);
const passingScoreForm = ref({
  qualified: 60
});

const totalQuestions = computed(() => questionList.value.length);
const totalScore = computed(() => questionList.value.reduce((sum, item) => sum + (Number(item.score) || 0), 0));

// 批量设置分数相关计算属性
const questionTypesForBatchScore = computed(() => [
  { type: 'SINGLE_CHOICE', name: '单选题' },
  { type: 'MULTIPLE_CHOICE', name: '多选题' },
  { type: 'TRUE_FALSE', name: '判断题' },
  { type: 'FILL_IN_BLANK', name: '填空题' },
  { type: 'ESSAY', name: '论述题' }
].filter(item => questionCountsByType.value[item.type] > 0));

const questionCountsByType = computed(() => {
  const counts = {
    SINGLE_CHOICE: 0,
    MULTIPLE_CHOICE: 0,
    TRUE_FALSE: 0,
    FILL_IN_BLANK: 0,
    ESSAY: 0
  };
  
  questionList.value.forEach(q => {
    if (counts.hasOwnProperty(q.questionType)) {
      counts[q.questionType]++;
    }
  });
  
  return counts;
});

const calculatedTotalScore = computed(() => {
  return Object.keys(questionCountsByType.value).reduce((sum, type) => {
    return sum + (questionCountsByType.value[type] * (batchScoreForm.value[type] || 0));
  }, 0);
});

const categoryName = computed(() => {
  if (!shootingRangeDetails.value || !categoryOptions.value.length) return '';
  const category = categoryOptions.value.find(c => c.value == shootingRangeDetails.value.shootingRangeCategory);
  return category ? category.label : '';
});
const timeRange = computed({
  get() {
    if (editForm.value && editForm.value.startTime && editForm.value.endTime) {
      return [editForm.value.startTime, editForm.value.endTime];
    }
    return [];
  },
  set(val) {
    if (editForm.value) {
      editForm.value.startTime = val ? val[0] : null;
      editForm.value.endTime = val ? val[1] : null;
    }
  }
});

watch(() => editForm.value?.duration, (newVal) => {
  isDurationLimited.value = newVal !== -1;
  if (newVal !== -1) {
    customDuration.value = newVal;
  }
});

// 自动保存功能
const getStorageKey = () => `${STORAGE_KEY_PREFIX}${rangeId.value}`;

const saveDraft = () => {
  try {
    if (!rangeId.value) return;
    
    const draftData = {
      clues: clues.value,
      questionList: questionList.value,
      timestamp: Date.now()
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(draftData));
    lastSaveTime.value = new Date();
    hasUnsavedChanges.value = false;
    console.log('靶场数据已自动保存到本地');
  } catch (error) {
    console.error('保存草稿失败:', error);
  }
};

const loadDraft = () => {
  try {
    if (!rangeId.value) return;
    
    const savedData = localStorage.getItem(getStorageKey());
    if (savedData) {
      const draftData = JSON.parse(savedData);
      const savedTime = new Date(draftData.timestamp);
      const timeDiff = Date.now() - draftData.timestamp;
      
      // 如果暂存数据在24小时内，提示恢复
      if (timeDiff < 24 * 60 * 60 * 1000 && (draftData.clues?.length > 0 || draftData.questionList?.length > 0)) {
        ElMessageBox.confirm(
          `检测到未完成的靶场编辑数据（${formatSaveTime(savedTime)}），是否恢复？`,
          '发现暂存数据',
          {
            confirmButtonText: '恢复数据',
            cancelButtonText: '放弃暂存',
            type: 'info',
          }
        ).then(() => {
          if (draftData.clues) clues.value = draftData.clues;
          if (draftData.questionList) questionList.value = draftData.questionList;
          lastSaveTime.value = savedTime;
          hasUnsavedChanges.value = false;
          ElMessage.success('已恢复暂存数据');
        }).catch(() => {
          clearDraft();
        });
      }
    }
  } catch (error) {
    console.error('加载草稿失败:', error);
    clearDraft();
  }
};

const clearDraft = () => {
  if (!rangeId.value) return;
  localStorage.removeItem(getStorageKey());
  lastSaveTime.value = null;
  hasUnsavedChanges.value = false;
};

// 防抖保存
const debouncedSave = () => {
  hasUnsavedChanges.value = true;
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveDraft();
  }, 2000); // 2秒后自动保存
};

// 格式化保存时间
const formatSaveTime = (time) => {
  if (!time) return '';
  const now = new Date();
  const diff = now - time;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else {
    return time.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

// 监听数据变化，自动保存
watch(
  [clues, questionList],
  () => {
    debouncedSave();
  },
  { deep: true }
);

// 浏览器刷新或关闭时的提醒
const handleBeforeUnload = (event) => {
  if (hasUnsavedChanges.value) {
    const message = '您有未保存的数据，建议手动保存后再离开';
    event.preventDefault();
    event.returnValue = message;
    saveDraft();
    return message;
  }
};

// 获取题目类型名称
const getQuestionTypeName = (type) => {
  const typeMap = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_IN_BLANK: '填空题',
    ESSAY: '论述题'
  };
  return typeMap[type] || type;
};

const handleClueEditorCreated = (editor) => { editorRef.value = editor; };
const destroyClueEditor = () => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
  editorRef.value = null;
};

const goBack = () => router.back();

// 将HTML内容中的图片路径转换为预览URL
const convertImagesToPreviewUrls = async (htmlContent) => {
  if (!htmlContent) return '';
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');
  
  const imagePromises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    
    try {
      let relativePath = src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        const url = new URL(src);
        let pathname = decodeURIComponent(url.pathname);
        const pathParts = pathname.split('/').filter(p => p);
        if (pathParts.length > 1) {
          relativePath = '/' + pathParts.slice(1).join('/');
        } else {
          relativePath = pathname;
        }
      }
      const previewUrl = await previewFile(relativePath);
      img.setAttribute('src', previewUrl);
    } catch (error) {
      console.error('预览图片失败:', src, error);
    }
  });
  
  await Promise.all(imagePromises);
  return doc.body.innerHTML;
};

const transformBackendToFrontend = (backendQuestions = []) => {
  const typeMapReverse = {
    '单选': 'SINGLE_CHOICE', '多选': 'MULTIPLE_CHOICE', '判断': 'TRUE_FALSE',
    '填空': 'FILL_IN_BLANK', '论述': 'ESSAY',
  };

  return backendQuestions.map(q => {
    const questionType = typeMapReverse[q.questionType] || 'SINGLE_CHOICE';
    const frontendQuestion = {
      uid: uuidv4(),
      id: q.id,
      title: q.title,
      questionType: questionType,
      difficulty: q.difficulty || 1,
      analysisContent: q.analysis || '',
      analysisType: q.analysis ? 'HAS_ANALYSIS' : 'NO_ANALYSIS',
      score: q.score || 5,
      editMode: 'simple',
      options: [],
      answer: null,
      showEditor: true, // 从后端加载的题目默认展开
    };

    try {
      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(questionType)) {
        const options = JSON.parse(q.details || '[]');
        frontendQuestion.options = options.map(opt => ({ content: opt.value }));

        if (questionType === 'SINGLE_CHOICE') {
          const correctOption = options.find(opt => opt.option === q.answer);
          frontendQuestion.answer = correctOption ? options.indexOf(correctOption) : null;
        } else {
          const answerArray = q.answer ? q.answer.split('#@#') : [];
          frontendQuestion.answer = options.reduce((acc, opt, index) => {
            if (answerArray.includes(opt.option)) {
              acc.push(index);
            }
            return acc;
          }, []);
        }
      } else if (questionType === 'TRUE_FALSE') {
        frontendQuestion.answer = q.answer;
      } else if (questionType === 'FILL_IN_BLANK') {
        frontendQuestion.answer = q.answer ? q.answer.split('#@#') : [];
      } else {
        frontendQuestion.answer = q.answer;
      }
    } catch (e) { console.error("解析题目详情失败", e); }

    return frontendQuestion;
  });
};

const fetchShootingRangeDetails = async () => {
  loading.value = true;
  try {
    const res = await getShootingRangeDetail({ id: rangeId.value });
    if (res.code === 200 && res.data) {
      shootingRangeDetails.value = res.data;
      
      // 转换线索中的图片
      clues.value = await Promise.all(
        (res.data.clues || []).map(async (c) => ({
          ...c,
          uid: uuidv4(),
          title: await convertImagesToPreviewUrls(c.title)
        }))
      );
      
      // 转换题目
      const transformedQuestions = transformBackendToFrontend(res.data.questions);
      questionList.value = await Promise.all(
        transformedQuestions.map(async (q) => ({
          ...q,
          title: await convertImagesToPreviewUrls(q.title),
          analysisContent: await convertImagesToPreviewUrls(q.analysisContent)
        }))
      );
    } else {
      ElMessage.error(res.msg || '获取靶场详情失败');
    }
  } catch (error) {
    ElMessage.error('获取靶场详情失败');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const res = await getDictData('shooting_range_category');
    categoryOptions.value = res.data.map(item => ({ label: item.dictLabel, value: item.dictValue }));
  } catch (error) { ElMessage.error('获取分类选项失败'); }
};

const saveCluesAndQuestions = async () => {
  try {
    const questionTypeMap = {
      SINGLE_CHOICE: '单选', MULTIPLE_CHOICE: '多选', TRUE_FALSE: '判断',
      FILL_IN_BLANK: '填空', ESSAY: '论述',
    };

    const backendQuestions = questionList.value.map((q, i) => {
      const backendQuestion = {
        questionType: questionTypeMap[q.questionType] || '',
        title: q.title,
        details: '',
        answer: '',
        analysis: q.analysisType === 'HAS_ANALYSIS' ? q.analysisContent : '',
        score: q.score,
        sort: i + 1,
      };

      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.questionType)) {
        backendQuestion.details = JSON.stringify(q.options.map((opt, i) => ({
          option: String.fromCharCode(65 + i),
          value: opt.content
        })));
        if (q.questionType === 'SINGLE_CHOICE' && q.answer !== null) {
          backendQuestion.answer = String.fromCharCode(65 + q.answer);
        } else if (q.questionType === 'MULTIPLE_CHOICE' && q.answer && q.answer.length > 0) {
          backendQuestion.answer = [...q.answer].sort((a, b) => a - b).map(i => String.fromCharCode(65 + i)).join('#@#');
        }
      } else if (q.questionType === 'TRUE_FALSE') {
        backendQuestion.answer = q.answer;
        backendQuestion.details = ''; // 判断题不需要details
      } else if (q.questionType === 'FILL_IN_BLANK') {
        backendQuestion.answer = q.answer ? q.answer.join('#@#') : '';
      } else {
        backendQuestion.answer = q.answer;
      }
      return backendQuestion;
    });

    const payload = {
      id: rangeId.value,
      clues: clues.value.map((c, i) => ({
        title: c.title,
        fileName: c.fileName,
        filePath: c.filePath,
        sort: i + 1
      })),
      questions: backendQuestions,
    };

    await setClueAndQuestionList(payload);
    ElMessage.success('保存成功！');
    clearDraft(); // 保存成功后清除暂存
    fetchShootingRangeDetails();
  } catch (error) {
    ElMessage.error('保存失败');
    console.error(error);
  }
};

const handleAddItem = (command) => {
  if (command === 'ADD_CLUE') {
    addClue();
  } else if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY'].includes(command)) {
    addQuestion(command);
  }
};

const createBaseQuestion = (type) => ({
  uid: uuidv4(),
  id: null,
  title: '',
  details: '',
  questionType: type,
  analysisType: 'NO_ANALYSIS',
  analysisContent: '',
  options: [{ content: '' }],
  answer: null,
  editMode: 'simple',
  score: 5,
  showEditor: true, // 新建题目默认展开
});

const addQuestion = (type) => {
  const base = createBaseQuestion(type);
  switch (type) {
    case 'MULTIPLE_CHOICE': base.answer = []; break;
    case 'TRUE_FALSE': base.answer = '0'; break; // 默认设置为正确
    case 'FILL_IN_BLANK': base.answer = ['']; base.options = []; break;
    case 'ESSAY': base.answer = ''; base.options = []; break;
  }
  questionList.value.push(base);
  debouncedSave();
};

const addClue = () => {
  clueForm.value = {
    uid: uuidv4(),
    isNew: true,
    title: '<p>请在此处输入线索内容...</p>',
    fileName: '',
    filePath: '',
  };
  attachmentList.value = [];
  clueEditorVisible.value = true;
};

const editClue = (index) => {
  const targetClue = clues.value[index];
  clueForm.value = {
    ...JSON.parse(JSON.stringify(targetClue)),
    index: index,
    isNew: false,
  };

  if (targetClue.fileName && targetClue.filePath) {
    attachmentList.value = [{ name: targetClue.fileName, url: targetClue.filePath }];
  } else {
    attachmentList.value = [];
  }

  clueEditorVisible.value = true;
};

const deleteClue = (index) => {
  clues.value.splice(index, 1);
  saveCluesAndQuestions();
};

const moveClueUp = (index) => {
  if (index > 0) {
    [clues.value[index - 1], clues.value[index]] = [clues.value[index], clues.value[index - 1]];
    saveCluesAndQuestions();
  }
};

const moveClueDown = (index) => {
  if (index < clues.value.length - 1) {
    [clues.value[index + 1], clues.value[index]] = [clues.value[index], clues.value[index + 1]];
    saveCluesAndQuestions();
  }
};

const handleDeleteQuestion = (index) => { 
  questionList.value.splice(index, 1); 
  debouncedSave();
};

const copyQuestion = (index) => {
  const originalQuestion = questionList.value[index];
  const copiedQuestion = JSON.parse(JSON.stringify(originalQuestion));
  copiedQuestion.uid = uuidv4();
  copiedQuestion.showEditor = true; // 默认收起
  questionList.value.splice(index + 1, 0, copiedQuestion);
  ElMessage.success('复制成功');
  debouncedSave();
};

const moveQuestionUp = (index) => {
  if (index > 0) {
    [questionList.value[index - 1], questionList.value[index]] = [questionList.value[index], questionList.value[index - 1]];
    debouncedSave();
  }
};

const moveQuestionDown = (index) => {
  if (index < questionList.value.length - 1) {
    [questionList.value[index + 1], questionList.value[index]] = [questionList.value[index], questionList.value[index + 1]];
    debouncedSave();
  }
};

const toggleQuestionEditor = (index) => {
  if (!questionList.value[index].hasOwnProperty('showEditor')) {
    questionList.value[index].showEditor = true;
  } else {
    questionList.value[index].showEditor = !questionList.value[index].showEditor;
  }
};

// 批量设置分数和设置合格分相关方法
const openBatchSetScoreDialog = () => {
  // 初始化表单数据
  batchScoreForm.value = {
    SINGLE_CHOICE: 5,
    MULTIPLE_CHOICE: 5,
    TRUE_FALSE: 5,
    FILL_IN_BLANK: 5,
    ESSAY: 10
  };
  batchSetScoreDialogVisible.value = true;
};

const handleScoreCommands = (command) => {
  if (command === 'setPassingScore') {
    openPassingScoreDialog();
  }
};

const openPassingScoreDialog = () => {
  passingScoreForm.value.qualified = shootingRangeDetails.value?.qualified || 60;
  setPassingScoreDialogVisible.value = true;
};

const submitBatchScores = async () => {
  try {
    // 更新本地题目的分数
    questionList.value.forEach(question => {
      if (batchScoreForm.value[question.questionType] !== undefined) {
        question.score = batchScoreForm.value[question.questionType];
      }
    });
    
    // 保存到后端
    await saveCluesAndQuestions();
    
    batchSetScoreDialogVisible.value = false;
    ElMessage.success('批量设置分数成功！');
  } catch (error) {
    ElMessage.error('批量设置分数失败');
  }
};

const submitPassingScore = async () => {
  try {
    const res = await setShootingRangeQualified({
      id: rangeId.value,
      qualified: passingScoreForm.value.qualified
    });
    
    if (res.code === 200) {
      // 更新本地数据
      if (shootingRangeDetails.value) {
        shootingRangeDetails.value.qualified = passingScoreForm.value.qualified;
      }
      
      setPassingScoreDialogVisible.value = false;
      ElMessage.success('设置合格分成功！');
    } else {
      ElMessage.error(res.msg || '设置合格分失败');
    }
  } catch (error) {
    ElMessage.error('设置合格分失败');
  }
};

const handleAttachmentUpload = async ({ file }) => {
  try {
    const res = await uploadFiles([file]);
    if (res.code === 200) {
      const filePath = Array.isArray(res.data) ? res.data[0] : res.data;
      clueForm.value.fileName = file.name;
      clueForm.value.filePath = filePath;
      attachmentList.value = [{ name: file.name, url: filePath }];
      ElMessage.success('附件上传成功');
    } else {
      throw new Error(res.msg || '上传失败');
    }
  } catch (error) {
    ElMessage.error(error.message);
    attachmentList.value = [];
  }
};

const handleAttachmentRemove = () => {
  clueForm.value.fileName = '';
  clueForm.value.filePath = '';
  attachmentList.value = [];
};

const previewClueFile = async (clue) => {
  if (!clue.filePath) return;
  try {
    const url = await previewFile(clue.filePath);
    window.open(url, '_blank');
  } catch (error) {
    ElMessage.error('获取预览地址失败');
  }
};

const saveClue = () => {
  if (clueForm.value.isNew) {
    clues.value.push({
      uid: clueForm.value.uid,
      title: clueForm.value.title,
      fileName: clueForm.value.fileName,
      filePath: clueForm.value.filePath,
    });
  } else {
    const index = clueForm.value.index;
    if (index !== undefined && clues.value[index]) {
      clues.value[index] = {
        ...clues.value[index],
        title: clueForm.value.title,
        fileName: clueForm.value.fileName,
        filePath: clueForm.value.filePath,
      };
    }
  }
  clueEditorVisible.value = false;
  saveCluesAndQuestions();
};

const handleEditQuestion = (question) => {
  editQuestionId.value = question.id;
  editDialogVisible.value = true;
};

const openBasicInfoDialog = () => {
  editForm.value = JSON.parse(JSON.stringify(shootingRangeDetails.value));
  basicInfoDialogVisible.value = true;
};

const openRangeSettingsDialog = () => {
  editForm.value = JSON.parse(JSON.stringify(shootingRangeDetails.value));
  selectedScopeUsers.value = [];
  selectedScopeClasses.value = [];
  if (editForm.value.clazzUserBindList) {
    if (editForm.value.scope === 1) {
      selectedScopeUsers.value = editForm.value.clazzUserBindList.map(item => ({ id: item.userId, name: item.userName, department: '...' }));
    } else if (editForm.value.scope === 2) {
      selectedScopeClasses.value = editForm.value.clazzUserBindList.map(item => ({ id: item.clazzId, name: item.clazzName, userCount: 0 }));
    }
  }
  rangeSettingsDialogVisible.value = true;
};

const submitUpdate = async () => {
  if (editForm.value.scope === 1) {
    editForm.value.clazzUserBindList = selectedScopeUsers.value.map(user => ({ userId: user.id, userName: user.name }));
  } else if (editForm.value.scope === 2) {
    editForm.value.clazzUserBindList = selectedScopeClasses.value.map(clazz => ({ clazzId: clazz.id, clazzName: clazz.name }));
  } else {
    editForm.value.clazzUserBindList = [];
  }

  try {
    await updateShootingRange(editForm.value);
    ElMessage.success('更新成功！');
    await fetchShootingRangeDetails();
    basicInfoDialogVisible.value = false;
    rangeSettingsDialogVisible.value = false;
  } catch (error) {
    ElMessage.error('更新失败');
  }
};

const openUserSelectionDialog = async () => {
  userSelectionDialogVisible.value = true;
  await fetchOrgTree();
  // 同步已选用户的状态到组织树
  syncSelectedUsersToTree();
};

// 新增方法：同步已选用户状态到组织树
const syncSelectedUsersToTree = () => {
  if (!orgTreeRef.value || selectedScopeUsers.value.length === 0) return;

  // 收集已选用户的树节点ID
  const checkedKeys = [];
  const collectUserNodeIds = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'user') {
        // 检查这个用户是否已被选中
        if (selectedScopeUsers.value.some(user => user.id === node.originalId)) {
          checkedKeys.push(node.id); // 使用树节点的ID（user_xxx格式）
        }
      }
      if (node.children && node.children.length > 0) {
        collectUserNodeIds(node.children);
      }
    }
  };

  collectUserNodeIds(orgTreeData.value);

  // 使用树组件的API设置选中状态
  setTimeout(() => {
    if (orgTreeRef.value && checkedKeys.length > 0) {
      orgTreeRef.value.setCheckedKeys(checkedKeys);
      console.log('设置树选中状态:', checkedKeys);
    }
  }, 100); // 给一点延迟确保DOM已渲染
};
const openClassSelectionDialog = async () => {
  classSelectionDialogVisible.value = true;
  await fetchClassList();
};

const fetchOrgTree = async () => {
  try {
    const res = await getAllOrgTree({ personnel: true });
    if (res.code === 200) {
      orgTreeData.value = transformOrgTreeData(res.data);
      // 在组织树加载完成后同步选中状态
      setTimeout(() => {
        syncSelectedUsersToTree();
      }, 200);
    } else {
      ElMessage.error(res.msg || '获取组织树失败');
    }
  } catch (error) {
    ElMessage.error('获取组织树失败');
  }
};
const transformOrgTreeData = (nodes) => {
  return (nodes || []).map(node => {
    const transformedNode = { id: `org_${node.id}`, name: node.orgName, type: 'org', children: [] };
    if (node.users) {
      transformedNode.children.push(...node.users.map(u => ({ 
        id: `user_${u.id}`, 
        originalId: u.id, 
        name: u.name, 
        type: 'user', 
        department: node.orgName,
        avatar: u.avatar,
        policeNumber: u.policeNumber,
        phone: u.username || u.phone
      })));
    }
    if (node.children) {
      transformedNode.children.push(...transformOrgTreeData(node.children));
    }
    return transformedNode;
  });
};
const handleUserSearch = async () => {
  if (!userSearchKeyword.value.trim()) {
    searchedUsers.value = [];
    return;
  }
  try {
    const response = await getUserList({
      pageNum: 1,
      pageSize: 50,
      param: userSearchKeyword.value.trim(),
      pagination: true
    });

    if (response.code === 200) {
      searchedUsers.value = response.data.records.map(user => {
        let department = user.orgName || user.organizationName || user.deptName || user.department;

        // 如果搜索结果中没有部门信息，尝试从组织树中查找
        if (!department && orgTreeData.value.length > 0) {
          const findUserInTree = (nodes) => {
            for (const node of nodes) {
              if (node.type === 'user' && node.originalId === user.id) {
                return node.department;
              }
              if (node.children && node.children.length > 0) {
                const found = findUserInTree(node.children);
                if (found) return found;
              }
            }
            return null;
          };

          department = findUserInTree(orgTreeData.value);
        }

        return {
          id: user.id,
          name: user.name,
          department: department || '未知部门',
          avatar: user.avatar || '',
          policeNumber: user.policeNumber || '',
          phone: user.username || '',
          checked: selectedScopeUsers.value.some(u => u.id === user.id)
        };
      });
    }
  } catch (error) {
    ElMessage.error('搜索用户失败');
  }
};
const handleUserCheck = (user) => {
  if (user.checked) {
    if (!selectedScopeUsers.value.some(u => u.id === user.id)) selectedScopeUsers.value.push(user);
  } else {
    selectedScopeUsers.value = selectedScopeUsers.value.filter(u => u.id !== user.id);
  }
};
const handleOrgTreeCheck = (data, { checkedNodes }) => {
  const users = checkedNodes.filter(node => node.type === 'user');
  
  selectedScopeUsers.value = users.map(user => ({
    id: user.originalId || user.id,
    name: user.name,
    department: user.department,
    avatar: user.avatar,
    policeNumber: user.policeNumber,
    phone: user.phone
  }));
};
const removeSelectedUser = (user) => {
  selectedScopeUsers.value = selectedScopeUsers.value.filter(u => u.id !== user.id);
  const treeNode = orgTreeRef.value?.getNode(`user_${user.id}`);
  if (treeNode && treeNode.checked) {
    orgTreeRef.value.setChecked(treeNode, false, false);
  }
};
const clearSelectedUsers = () => {
  selectedScopeUsers.value = [];
  orgTreeRef.value?.setCheckedKeys([]);
};
const confirmSelectedUsers = () => { userSelectionDialogVisible.value = false; };

const fetchClassList = async () => {
  try {
    const res = await getClassList({ 
      page: classCurrentPage.value, 
      size: classPageSize.value, 
      name: classSearchKeyword.value,
      isMe: classTabActive.value === 'my', // 根据标签页切换 isMe 参数
      clazzStatus: ''
    });
    if (res.code === 200) {
      // 将 clazzStatus == 2 的班级设置为禁用状态
      classListData.value = res.data.records.map(c => ({ 
        id: c.id,
        name: c.name,
        // 后端返回的字段是 clazzUserCount
        userCount: c.clazzUserCount || c.userCount || 0, 
        checked: selectedScopeClasses.value.some(s => s.id === c.id),
        disabled: c.clazzStatus == 2, // 已结束的班级设置为禁用
        clazzStatus: c.clazzStatus
      }));
      classTotal.value = res.data.total || 0;
    }
  } catch (e) { ElMessage.error("获取班级列表失败"); }
};

const handleClassSearch = () => { 
  classCurrentPage.value = 1;
  fetchClassList(); 
};

const handleClassPageChange = (page) => { 
  classCurrentPage.value = page; 
  fetchClassList(); 
};

const handleClassTabChange = () => {
  classCurrentPage.value = 1; // 切换标签页时重置到第一页
  fetchClassList();
};
const handleClassCheck = (clazz) => {
  if (clazz.checked) {
    if (!selectedScopeClasses.value.some(c => c.id === clazz.id)) selectedScopeClasses.value.push(clazz);
  } else {
    selectedScopeClasses.value = selectedScopeClasses.value.filter(c => c.id !== clazz.id);
  }
};
const removeSelectedClass = (clazz) => {
  selectedScopeClasses.value = selectedScopeClasses.value.filter(c => c.id !== clazz.id);
  const itemInList = classListData.value.find(c => c.id === clazz.id);
  if (itemInList) itemInList.checked = false;
};
const clearSelectedClasses = () => {
  selectedScopeClasses.value = [];
  classListData.value.forEach(c => c.checked = false);
};
const confirmSelectedClasses = () => { classSelectionDialogVisible.value = false; };

// 切换发布状态
const togglePublishStatus = async () => {
  const currentStatus = shootingRangeDetails.value.status;
  const newStatus = currentStatus === 1 ? 0 : 1;
  const actionText = newStatus === 1 ? '发布' : '取消发布';
  
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}该靶场吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    const res = await updateShootingRangeStatus({
      id: rangeId.value,
      status: newStatus
    });
    
    if (res.code === 200) {
      shootingRangeDetails.value.status = newStatus;
      ElMessage.success(`${actionText}成功！`);
    } else {
      ElMessage.error(res.msg || `${actionText}失败`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`${actionText}失败`);
    }
  }
};

onMounted(() => {
  rangeId.value = route.params.id;
  if (rangeId.value) {
    fetchShootingRangeDetails();
    fetchCategories();
    
    // 监听浏览器刷新或关闭事件
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 延迟加载暂存数据，确保组件完全加载
    setTimeout(() => {
      loadDraft();
    }, 500);
  } else {
    ElMessage.error('无效的靶场ID');
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.range-setup-page {
  padding: 20px;
  background-color: #f0f2f5;
  height: 100%;
  overflow-y: auto;
}

.page-header-title {
  font-size: 18px;
  font-weight: 600;
}

.main-layout {
  display: flex;
  margin-top: 20px;
  gap: 20px;
}

.left-panel {
  flex: 3;
  min-width: 0;
}

.right-panel {
  flex: 1;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: bold;
}

.dialog-stat-text {
  margin: 0 10px;
  color: #606266;
  font-size: 14px;
}

.content-list-container {
  padding: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.item-card {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}

.item-card .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.item-index {
  font-weight: bold;
  flex-shrink: 0;
}

.item-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-score .el-input-number {
  width: 80px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-body .item-title {
  margin-bottom: 12px;
}

.item-attachment {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-attachment a {
  cursor: pointer;
  color: #409eff;
}

.item-attachment a:hover {
  text-decoration: underline;
}

.form-hint {
  font-size: 12px;
  color: #909399;
}

.certificate-section {
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
}

.action-buttons .el-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
}

.add-member-dialog,
.add-class-dialog {
  display: flex;
  gap: 20px;
  height: 500px;
}

.user-tree-section,
.class-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.search-section {
  margin-bottom: 16px;
}

.user-tree-container,
.class-list-container {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
}

.selected-users-section,
.selected-classes-section {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e4e7ed;
  padding-left: 20px;
}

.search-results {
  height: 100%;
}

.search-tip {
  color: #909399;
  font-size: 12px;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.user-item {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: 500;
}

.user-dept {
  color: #909399;
  font-size: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.selected-users-list-dialog,
.selected-classes-list-dialog {
  flex: 1;
  overflow: auto;
}

.selected-user-item,
.selected-class-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.remove-btn {
  color: #f56c6c;
}

.selected-users-display, .selected-classes-display {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}
.no-selection {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}
.selection-summary {
  font-size: 14px;
  color: #606266;
}
.selected-list {
  margin-top: 8px;
}
.more-items {
  color: #909399;
  font-size: 12px;
  margin-left: 5px;
}

.form-hint { font-size: 12px; color: #909399; }
.add-member-dialog, .add-class-dialog { display: flex; gap: 20px; height: 500px; }
.user-tree-section, .class-list-section { flex: 1; display: flex; flex-direction: column; }
.search-section { margin-bottom: 16px; }
.user-tree-container, .class-list-container { flex: 1; overflow: auto; border: 1px solid #e4e7ed; border-radius: 4px; padding: 8px; }
.selected-users-section, .selected-classes-section { width: 300px; display: flex; flex-direction: column; border-left: 1px solid #e4e7ed; padding-left: 20px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed; }
.selected-users-list-dialog, .selected-classes-list-dialog { flex: 1; overflow: auto; }
.selected-user-item, .selected-class-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-bottom: 1px solid #f0f0f0; }
.remove-btn { color: #f56c6c; }
.tree-node, .user-info, .class-info { display: flex; align-items: center; gap: 8px; }
.user-dept, .class-members { font-size: 12px; color: #909399; }
.class-tabs {
  margin-bottom: 16px;
}

.class-tabs .el-radio-group {
  width: 100%;
  display: flex;
}

.class-tabs .el-radio-button {
  flex: 1;
}

.class-tabs .el-radio-button__inner {
  width: 100%;
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.class-tabs .el-radio-button:first-child .el-radio-button__inner {
  border-radius: 4px 0 0 4px;
}

.class-tabs .el-radio-button:last-child .el-radio-button__inner {
  border-radius: 0 4px 4px 0;
}

.class-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.class-item { padding: 8px; border-bottom: 1px solid #f0f0f0; }
.class-item.disabled-class { opacity: 0.6; background-color: #f5f7fa; }
.class-details { display: flex; align-items: center; gap: 8px; }
.status-tag { font-size: 12px; color: #909399; background-color: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
.selected-users-display, .selected-classes-display {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}
.no-selection {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}
.selection-summary {
  font-size: 14px;
  color: #606266;
}
.selected-list {
  margin-top: 8px;
}
.more-items {
  color: #909399;
  font-size: 12px;
  margin-left: 5px;
}

.save-status {
  display: flex;
  align-items: center;
  color: #67c23a;
  font-size: 12px;
  margin-left: 16px;
}

.save-icon {
  margin-right: 4px;
}

.unsaved-status {
  display: flex;
  align-items: center;
  color: #e6a23c;
  font-size: 12px;
  margin-left: 16px;
}

.unsaved-icon {
  margin-right: 4px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.question-preview {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 4px;
  min-height: 50px;
}

.question-title {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  overflow-wrap: break-word;
}

.question-title :deep(img),
.item-title :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px 0;
}
</style>