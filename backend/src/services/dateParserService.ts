interface ParsedDateInfo {
  detectedTimeKeywords: string[];
  calculatedDate: string; // YYYY-MM-DD格式
  baseDate: string;
  description: string;
}

class DateParserService {
  // 时间关键词映射
  private timeKeywords = {
    today: ['今天', '今日', '现在', '当天'],
    tomorrow: ['明天', '明日', '明儿'],
    dayAfterTomorrow: ['后天', '大后天'],
    nextWeek: ['下周', '下星期', '下礼拜', '下个星期'],
    thisWeek: ['这周', '这星期', '这礼拜', '本周', '本星期'],
    weekend: ['周末', '礼拜天', '星期天', '星期六', '周六', '周日']
  };

  /**
   * 解析用户输入，提取时间信息并计算具体日期
   * @param userInput 用户输入的文本
   * @param baseDate 基准日期，格式：YYYY-MM-DD，如果不提供则使用当前日期
   * @returns 解析结果
   */
  parseUserInput(userInput: string, baseDate?: string): ParsedDateInfo {
    const base = baseDate ? this.parseDate(baseDate) : new Date();
    const baseDateStr = this.formatDate(base);
    
    // 检测时间关键词
    const detectedKeywords: string[] = [];
    let calculatedDate = this.formatDate(new Date(base.getTime() + 24 * 60 * 60 * 1000)); // 默认明天
    
    const inputLower = userInput.toLowerCase();
    
    // 检查今天
    if (this.containsAnyKeyword(inputLower, this.timeKeywords.today)) {
      detectedKeywords.push('今天');
      calculatedDate = baseDateStr;
    }
    // 检查明天
    else if (this.containsAnyKeyword(inputLower, this.timeKeywords.tomorrow)) {
      detectedKeywords.push('明天');
      calculatedDate = this.formatDate(new Date(base.getTime() + 24 * 60 * 60 * 1000));
    }
    // 检查后天
    else if (this.containsAnyKeyword(inputLower, this.timeKeywords.dayAfterTomorrow)) {
      detectedKeywords.push('后天');
      calculatedDate = this.formatDate(new Date(base.getTime() + 2 * 24 * 60 * 60 * 1000));
    }
    // 检查下周
    else if (this.containsAnyKeyword(inputLower, this.timeKeywords.nextWeek)) {
      detectedKeywords.push('下周');
      calculatedDate = this.formatDate(new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
    // 检查这周/本周
    else if (this.containsAnyKeyword(inputLower, this.timeKeywords.thisWeek)) {
      detectedKeywords.push('本周');
      // 本周默认设为明天，可以根据需要调整
      calculatedDate = this.formatDate(new Date(base.getTime() + 24 * 60 * 60 * 1000));
    }
    // 检查周末
    else if (this.containsAnyKeyword(inputLower, this.timeKeywords.weekend)) {
      detectedKeywords.push('周末');
      // 计算下一个周六
      const nextSaturday = this.getNextWeekend(base);
      calculatedDate = this.formatDate(nextSaturday);
    }

    console.log('日期解析结果:', {
      userInput,
      baseDate: baseDateStr,
      detectedKeywords,
      calculatedDate
    });

    return {
      detectedTimeKeywords: detectedKeywords,
      calculatedDate,
      baseDate: baseDateStr,
      description: userInput
    };
  }

  /**
   * 检查文本是否包含任何指定的关键词
   */
  private containsAnyKeyword(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * 获取下一个周末（周六）
   */
  private getNextWeekend(baseDate: Date): Date {
    const date = new Date(baseDate);
    const currentDay = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
    
    let daysToAdd;
    if (currentDay === 0) { // 周日
      daysToAdd = 6; // 到下周六
    } else if (currentDay === 6) { // 周六
      daysToAdd = 7; // 到下周六
    } else { // 周一到周五
      daysToAdd = 6 - currentDay; // 到本周六
    }
    
    return new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  /**
   * 解析日期字符串为Date对象
   */
  private parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * 格式化Date对象为YYYY-MM-DD字符串
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取当前日期字符串
   */
  getCurrentDate(): string {
    return this.formatDate(new Date());
  }

  /**
   * 验证日期格式
   */
  isValidDateFormat(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  }
}

export const dateParserService = new DateParserService();
export { ParsedDateInfo };
