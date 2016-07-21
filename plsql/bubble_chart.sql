function render
(
    p_region              in apex_plugin.t_region,
    p_plugin              in apex_plugin.t_plugin,
    p_is_printer_friendly in boolean
)
return apex_plugin.t_region_render_result
is
begin
    sys.htp.p(
      '<div class="a-D3BubbleChart" id="' || p_region.static_id || '_region">' ||
        '<div class="a-D3BubbleChart-container" id="' || p_region.static_id || '_chart"></div>' ||
      '</div>'
    );

    apex_javascript.add_onload_code(
      p_code => 'com_oracle_apex_d3_bubblechart(' ||
        apex_javascript.add_value(p_region.static_id) ||
        apex_javascript.add_value(apex_plugin.get_ajax_identifier) ||
        '{' ||
            apex_javascript.add_attribute('chartRegionId', p_region.static_id, false, false) ||
        '});'
    );

    return null;
end;

function ajax
(
    p_region  in apex_plugin.t_region,
    p_plugin  in apex_plugin.t_plugin
)
return apex_plugin.t_region_ajax_result
is

    c_x_column     constant varchar2(255) := p_region.attribute_01;
    c_y_column     constant varchar2(255) := p_region.attribute_02;
    c_r_column     constant varchar2(255) := p_region.attribute_03;
    c_label_column constant varchar2(255) := p_region.attribute_04;

    l_x_column_no     pls_integer;
    l_y_column_no     pls_integer;
    l_r_column_no     pls_integer;
    l_label_column_no pls_integer;

    l_column_value_list apex_plugin_util.t_column_value_list2;

    l_x     number;
    l_y     number;
    l_r     number;
    l_label varchar2(4000);

begin
    sys.dbms_output.enable;
    sys.dbms_output.put_line(p_region.attribute_01);
    sys.dbms_output.put_line(p_region.attribute_02);
    apex_debug.log_dbms_output;

    apex_json.initialize_output(p_http_cache => false);

    -- JSONの作成開始
    apex_json.open_object;

    -- SQLの実行結果を格納(apex_plugin_util.t_column_value_list2型)

    l_column_value_list := apex_plugin_util.get_data2(
        p_sql_statement  => p_region.source,
        p_min_columns    => 2,
        p_max_columns    => 5,
        p_component_name => p_region.name
    );

    -- l_column_value_listというリスト（配列の配列のイメージ）におけるカラムのインデックスを
    -- 必要なカラムごとに求める
    l_x_column_no := apex_plugin_util.get_column_no(
        p_attribute_label   => 'x column',
        p_column_alias      => c_x_column,
        p_column_value_list => l_column_value_list,
        p_is_required       => true,
        p_data_type         => apex_plugin_util.c_data_type_number
    );

    l_y_column_no := apex_plugin_util.get_column_no(
        p_attribute_label   => 'y column',
        p_column_alias      => c_y_column,
        p_column_value_list => l_column_value_list,
        p_is_required       => true,
        p_data_type         => apex_plugin_util.c_data_type_number
    );

    l_r_column_no := apex_plugin_util.get_column_no(
        p_attribute_label   => 'r column',
        p_column_alias      => c_r_column,
        p_column_value_list => l_column_value_list,
        p_is_required       => true,
        p_data_type         => apex_plugin_util.c_data_type_number
    );

    l_label_column_no := apex_plugin_util.get_column_no(
        p_attribute_label   => 'label column',
        p_column_alias      => c_label_column,
        p_column_value_list => l_column_value_list,
        p_is_required       => true,
        p_data_type         => apex_plugin_util.c_data_type_varchar2
    );

    -- data: []という配列の作成開始
    apex_json.open_array('data');
    for l_row_num in 1 .. l_column_value_list(1).value_list.count loop
        begin
            l_x := l_column_value_list(l_x_column_no).value_list(l_row_num).number_value;
            l_y := l_column_value_list(l_y_column_no).value_list(l_row_num).number_value;
            l_r := l_column_value_list(l_r_column_no).value_list(l_row_num).number_value;
            l_label := apex_plugin_util.get_value_as_varchar2(
                p_data_type => l_column_value_list(l_label_column_no).data_type,
                p_value     => l_column_value_list(l_label_column_no).value_list(l_row_num)
            );
            apex_json.open_object;
            apex_json.write('label', l_label);
            apex_json.write('x', l_x);
            apex_json.write('y', l_y);
            apex_json.write('r', l_r);
            apex_json.close_object;

            apex_plugin_util.clear_component_values;
        exception when others then
            apex_plugin_util.clear_component_values;
            raise;
        end;
    end loop;

    apex_json.close_array;
    apex_json.close_object;

    return null;
end;
