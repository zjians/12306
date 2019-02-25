$(function () {
  let station_names_array = []
  let queryUrl = 'leftTicket/queryZ'
  let station_train_code = ''
  let can_click = true // 节流
  $.ajax({
    type: 'GET',
    url: `https://kyfw.12306.cn/otn/${queryUrl}?leftTicketDTO.train_date=2019-02-20&leftTicketDTO.from_station=VNP&leftTicketDTO.to_station=NKH&purpose_codes=ADULT`,
    error: function (res) {
      queryUrl = res.responseJSON.c_url
    }
  })
  $(document).on('click', '.train', (e) => {
    $('#train_div_').width('400px')
    if (!can_click) {
      return
    }
    can_click = false
    if (!station_names_array.length) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = "document.body.setAttribute('data-station-name', station_names);";
      document.head.appendChild(script);
      document.head.removeChild(script);
      const station_names = document.body.getAttribute('data-station-name')
      if (station_names) {
        station_names_array = station_names.split('@')
      }
    }
    const el_pop = $('#train_div_')
    station_train_code = $(e.target).html()
    $('#train_span_').width('400px')
    $('.station-bd').width('100%')
    if (el_pop.css('display') != 'none') {
      handleGetDataForTr($('#train_table_ > tr'))
    } else {
      const tr_timer = setInterval(() => {
        if (el_pop.css('display') != 'none') {
          clearInterval(tr_timer)
          handleGetDataForTr($('#train_table_ > tr'))
          can_click = true
        }
      }, 200)
    }
  })

  function getShortName (stationName) {
    const regExp = new RegExp(`[\|]${stationName}[\|]`)
    const nameString = station_names_array.find((item) => {
      return regExp.test(item)
    })
    return nameString.split('|')[2]
  }

  function handleGetDataForTr (el_tr) {
    const color =  $('#train_table_ > tr > td:first-child')
    let startStation = null
    const train_date = $('#train_date').val()
    el_tr.each(function (i) {
      const isEnabled = $($(this).children()[0]).css('color') !== 'rgb(153, 153, 153)'
      if (!startStation && isEnabled) {
        startStation = $($(this).children()[1]).html()
      }
      if (isEnabled) {
        let currentStation = $($(this).children()[1]).html()
        if (startStation === currentStation) {return}
        const url = `https://kyfw.12306.cn/otn/${queryUrl}`
        const data = {
          'leftTicketDTO.train_date': train_date,
          'leftTicketDTO.from_station': getShortName(startStation),
          'leftTicketDTO.to_station': getShortName(currentStation),
          'purpose_codes': 'ADULT'
        }
        $.ajax({
          type: 'GET',
          url: url,
          data: data,
          success: handleSuccessCallback.bind(this, i, el_tr),
        })
        $(this).append(`<td class='zj-loading'><img src='${chrome.extension.getURL('../assets/images/loading.gif')}'/></td>`)
      }
    })
  }

  function handleSuccessCallback (currentStationIndex, el_tr, res) {
    if (!res.data || !res.data.result.length) {
      $(el_tr[currentStationIndex]).children('.zj-loading').remove()
      $(el_tr[currentStationIndex]).append(`<td><span class='zj-disabled' disabled>--</span></td>`)
      return
    }
    const stationData = formatData(res.data.result)
    if (stationData && stationData.length) {
      stationData.find((item, index) => {
        const station_query = item['queryLeftNewDTO']
        if (station_query.station_train_code === station_train_code) {
          if (station_query.canWebBuy === 'Y') {
            $(el_tr[currentStationIndex]).children('.zj-loading').remove()
            $(el_tr[currentStationIndex]).append(`<td><a href="javascript:" onclick="checkG1234('${item.secretStr}', '${station_query.start_time}', '${station_query.train_no}', '${station_query.from_station_telecode}', '${station_query.to_station_telecode}')">购买</a></td>`)
          } else {
            $(el_tr[currentStationIndex]).children('.zj-loading').remove()
            $(el_tr[currentStationIndex]).append(`<td><span class='zj-disabled' disabled>购买</span></td>`)
          }
          return true
        } else if (index === stationData.length - 1) { // 若没有找到则返回 '--'
          $(el_tr[currentStationIndex]).children('.zj-loading').remove()
          $(el_tr[currentStationIndex]).append(`<td><span class='zj-disabled' disabled>--</span></td>`)
        }
      })
    }
  }

  function formatData(ct, cv) {
    var cs = [];
    for (var cr = 0; cr < ct.length; cr++) {
        var cw = [];
        var cq = ct[cr].split("|");
        cw.secretHBStr = cq[36];
        cw.secretStr = cq[0];
        cw.buttonTextInfo = cq[1];
        var cu = [];
        cu.train_no = cq[2]; // 车票号
        cu.station_train_code = cq[3]; // 车次
        cu.start_station_telecode = cq[4]; // 起始站代号
        cu.end_station_telecode = cq[5]; // 终点站代号
        cu.from_station_telecode = cq[6]; // 出发站代号
        cu.to_station_telecode = cq[7]; // 到达站代号
        cu.start_time = cq[8]; // 出发时间
        cu.arrive_time = cq[9]; // 到达时间
        cu.lishi = cq[10]; // 历时
        cu.canWebBuy = cq[11]; // 是否能购买：Y 可以
        cu.yp_info = cq[12];
        cu.start_train_date = cq[13]; // 出发日期
        cu.train_seat_feature = cq[14]; 
        cu.location_code = cq[15];
        cu.from_station_no = cq[16];  
        cu.to_station_no = cq[17];
        cu.is_support_card = cq[18];
        cu.controlled_train_flag = cq[19];
        cu.gg_num = cq[20] ? cq[20] : "--";
        cu.gr_num = cq[21] ? cq[21] : "--";
        cu.qt_num = cq[22] ? cq[22] : "--";
        cu.rw_num = cq[23] ? cq[23] : "--"; // 软卧
        cu.rz_num = cq[24] ? cq[24] : "--"; // 软座
        cu.tz_num = cq[25] ? cq[25] : "--"; 
        cu.wz_num = cq[26] ? cq[26] : "--"; // 无座
        cu.yb_num = cq[27] ? cq[27] : "--";
        cu.yw_num = cq[28] ? cq[28] : "--"; // 硬卧
        cu.yz_num = cq[29] ? cq[29] : "--"; 
        cu.ze_num = cq[30] ? cq[30] : "--"; // 二等座
        cu.zy_num = cq[31] ? cq[31] : "--"; // 一等座
        cu.swz_num = cq[32] ? cq[32] : "--"; // 商务特等座
        cu.srrb_num = cq[33] ? cq[33] : "--";
        cu.yp_ex = cq[34];
        cu.seat_types = cq[35];
        cu.exchange_train_flag = cq[36];
        // cu.from_station_name = cv[cq[6]];
        // cu.to_station_name = cv[cq[7]];
        cw.queryLeftNewDTO = cu;
        cs.push(cw)
    }
    return cs
  }

})